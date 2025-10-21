export const runtime = 'edge';

type GenBody = { prompt?: string; mood?: string; category?: string };

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'content-type': 'application/json' },
    });
  }
  const { prompt = '', mood = '', category = '' } = (await req.json() as GenBody);

  const sys = `You are MoodCaster. Generate a short, first-person Farcaster cast in English.
Keep it friendly, concise (~220 chars), optionally 1 emoji. Avoid hashtags unless clearly helpful.`;
  const user = [prompt && `Prompt: ${prompt}`, mood && `Mood: ${mood}`, category && `Category: ${category}`]
    .filter(Boolean).join('\n');

  const model = process.env.GROQ_MODEL_ID || 'llama-3.1-8b-instant';
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Missing GROQ_API_KEY' }), {
      status: 500, headers: { 'content-type': 'application/json' },
    });
  }

  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: user || 'Write a short friendly cast.' },
      ],
      temperature: 0.6, max_tokens: 180,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    return new Response(JSON.stringify({ error: 'Groq request failed', detail: errText }), {
      status: 500, headers: { 'content-type': 'application/json' },
    });
  }

  const data = await resp.json();
  const text = data?.choices?.[0]?.message?.content?.trim?.() ?? 'Feeling optimistic today ✨';
  return new Response(JSON.stringify({ text }), { headers: { 'content-type': 'application/json' } });
}
