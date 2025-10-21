export const runtime = 'edge';

type GenBody = {
  mood?: string;
  category?: string;
  diverse?: boolean;
};

export default async function handler(req: Request): Promise<Response> {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405, headers: { 'content-type': 'application/json' },
      });
    }

    const { mood = '', category = '', diverse = false } = (await req.json()) as GenBody;

    const sys = `You are MoodCaster. Generate a short, first-person Farcaster cast in English. 
Keep it natural, friendly, and within ~220 characters. Optionally include 1 relevant emoji. 
Avoid hashtags unless clearly beneficial.`;

    const user =
      `Mood: ${mood}\nCategory: ${category}\nConstraints: Keep within 220 characters; avoid hashtags; one emoji max.`;

    const model = process.env.GROQ_MODEL_ID || 'llama-3.1-8b-instant';
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Missing GROQ_API_KEY' }), {
        status: 500, headers: { 'content-type': 'application/json' },
      });
    }

    // Abort after 18s to prevent hangs
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort('timeout'), 18000);

    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: user },
        ],
        temperature: diverse ? 0.9 : 0.6,
        max_tokens: 180,
      }),
    }).finally(() => clearTimeout(timer));

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      return new Response(JSON.stringify({ error: 'Groq request failed', detail: errText }), {
        status: resp.status || 500, headers: { 'content-type': 'application/json' },
      });
    }

    const data = await resp.json();
    const text =
      data?.choices?.[0]?.message?.content?.trim?.() ?? 'Feeling optimistic today ✨';

    return new Response(JSON.stringify({ text }), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (err: any) {
    const msg = String(err?.message || err || '');
    const isTimeout = msg.toLowerCase().includes('abort') || msg.includes('timeout');
    return new Response(
      JSON.stringify({ error: isTimeout ? 'Upstream timeout' : 'Unhandled error', detail: msg }),
      { status: 500, headers: { 'content-type': 'application/json' } },
    );
  }
}
