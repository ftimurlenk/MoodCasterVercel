export const config = { runtime: 'edge' };
export default async function handler(): Promise<Response> {
  const model = process.env.GROQ_MODEL_ID || 'llama-3.1-8b-instant';
  return new Response(JSON.stringify({ ok: true, model }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}