export const runtime = 'edge';

type GenBody = {
  mood?: string; // MoodKey
  category?: string; // CategoryKey
  diverse?: boolean;
};

const REQUEST_TIMEOUT_MS = 12000;

function formatLabel(raw: string, fallback: string): string {
  const value = raw?.trim();
  if (!value) return fallback;
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildFallbackCast(mood: string, category: string, diverse: boolean): string {
  const moodLabel = formatLabel(mood, 'Balanced');
  const categoryLabel = formatLabel(category, 'updates');
  const templates = [
    `Feeling ${moodLabel.toLowerCase()} and sharing a quick ${categoryLabel.toLowerCase()} note today.`,
    `${moodLabel} vibes going strong—here's a ${categoryLabel.toLowerCase()} moment from my day.`,
    `Riding a ${moodLabel.toLowerCase()} wave while thinking about ${categoryLabel.toLowerCase()} stuff.`,
    `${moodLabel} mood activated! Dropping a ${categoryLabel.toLowerCase()} thought for the feed.`,
  ];
  const suffix = diverse
    ? ' Curious where this goes next—hit me with your thoughts!'
    : ' What do you think?';
  const pick = templates[Math.floor(Math.random() * templates.length)];
  return `${pick}${suffix}`.trim().slice(0, 280);
}

function collectText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return value.map((item) => collectText(item)).join('');
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj.text === 'string') return obj.text;
    if (obj.text != null) {
      const nested = collectText(obj.text);
      if (nested) return nested;
    }
    if (typeof obj.content === 'string') return obj.content;
    if (Array.isArray(obj.content)) return obj.content.map((item) => collectText(item)).join('');
  }
  return '';
}

function extractChoiceText(payload: any): string {
  if (!payload) return '';
  const choices: any[] | undefined = payload.choices;
  if (Array.isArray(choices)) {
    for (const choice of choices) {
      const parts =
        collectText(choice?.delta?.content) ||
        collectText(choice?.delta?.text) ||
        collectText(choice?.message?.content) ||
        collectText(choice?.text);
      if (parts) return parts;
    }
  }
  if (payload.output) {
    return collectText(payload.output);
  }
  if (payload.response) {
    return collectText(payload.response);
  }
  return collectText(payload);
}

async function readEventStream(resp: Response): Promise<string> {
  const reader = resp.body?.getReader();
  if (!reader) return '';
  const decoder = new TextDecoder();
  let buffer = '';
  let output = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let delimiterIndex = buffer.indexOf('\n\n');
    while (delimiterIndex !== -1) {
      const rawEvent = buffer.slice(0, delimiterIndex).trim();
      buffer = buffer.slice(delimiterIndex + 2);

      if (rawEvent) {
        const lines = rawEvent.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const dataStr = trimmed.slice(5).trim();
          if (!dataStr) continue;
          if (dataStr === '[DONE]') {
            return output.trim();
          }
          try {
            const parsed = JSON.parse(dataStr);
            const text = extractChoiceText(parsed);
            if (text) {
              output += text;
            }
          } catch {
            // ignore malformed chunks
          }
        }
      }

      delimiterIndex = buffer.indexOf('\n\n');
    }
  }

  return output.trim();
}

async function parseGroqResponse(resp: Response): Promise<string> {
  const contentType = resp.headers.get('content-type')?.toLowerCase() ?? '';

  if (contentType.includes('text/event-stream')) {
    const streamed = await readEventStream(resp);
    if (streamed) return streamed;
    throw new Error('Empty Groq event stream response');
  }

  if (contentType.includes('application/json')) {
    const data = await resp.json().catch(() => null);
    if (!data) throw new Error('Invalid JSON response from Groq');
    const text = extractChoiceText(data);
    if (text) return text;
    throw new Error('Groq response missing content');
  }

  const raw = await resp.text().catch(() => '');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      const text = extractChoiceText(parsed);
      if (text) return text;
    } catch {
      // raw might not be JSON – return trimmed snippet for debugging
    }
  }
  throw new Error(`Unsupported Groq response content-type: ${contentType || 'unknown'}`);
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    });
  }

  const body = (await req.json().catch(() => null)) as GenBody | null;
  if (!body || typeof body !== 'object') {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const mood = body.mood ?? '';
  const category = body.category ?? '';
  const diverse = Boolean(body.diverse);

  if (!mood || !category) {
    return new Response(JSON.stringify({ error: 'Mood and category are required' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const sys = `You are MoodCaster. Generate a short, first-person Farcaster cast in English.
Keep it natural, friendly, within ~220 characters. One emoji max. Avoid hashtags unless clearly helpful.`;

  const user = `Mood: ${mood}\nCategory: ${category}`;

  const model = process.env.GROQ_MODEL_ID || 'llama-3.1-8b-instant';
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Missing GROQ_API_KEY' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort('timeout'), REQUEST_TIMEOUT_MS);

  try {
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
        accept: 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: user },
        ],
        temperature: diverse ? 0.9 : 0.6,
        max_tokens: 160,
        stream: false,
      }),
    }).finally(() => clearTimeout(timer));

    if (!resp.ok) {
      const clone = resp.clone();
      const errText = await clone.text().catch(() => '');
      throw new Error(errText || resp.statusText || `Groq error ${resp.status}`);
    }

    const generated = (await parseGroqResponse(resp)).trim();
    const usedFallback = !generated;
    const text = usedFallback ? buildFallbackCast(mood, category, diverse) : generated;
    if (usedFallback) {
      console.warn('Groq response empty, served fallback cast');
    }

    return new Response(
      JSON.stringify({
        text,
        ...(usedFallback ? { fallback: true, detail: 'Empty response from Groq' } : {}),
      }),
      {
        headers: { 'content-type': 'application/json' },
      },
    );
  } catch (err: any) {
    clearTimeout(timer);
    const msg = String(err?.message || err || '');
    console.error('Groq generate failed', err);
    const fallback = buildFallbackCast(mood, category, diverse);
    return new Response(
      JSON.stringify({ text: fallback, fallback: true, detail: msg }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      },
    );
  }
}
