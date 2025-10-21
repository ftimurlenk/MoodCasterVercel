import Groq from 'groq-sdk';
export const config = { runtime: 'edge' };
export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  const { GROQ_API_KEY, GROQ_MODEL_ID } = process.env as Record<string, string | undefined>;
  if (!GROQ_API_KEY) return new Response(JSON.stringify({ error: 'Missing GROQ_API_KEY' }), { status: 500 });
  const { mood, category, diversity } = await req.json() as any;
  if (!mood || !category) return new Response(JSON.stringify({ castText: '', error: 'mood and category are required' }), { status: 400 });
  const groq = new Groq({ apiKey: GROQ_API_KEY });
  const MODEL_ID = GROQ_MODEL_ID || 'llama-3.1-8b-instant';
  const styleHints = ['Vary sentence openings; avoid templates.','Use one vivid but natural adjective.','Ask one short rhetorical question.','Prefer active voice and fresh verbs.','Avoid cliches and common slogans.'];
  const hint = category==='Good Night'?'Write something relaxing and positive before sleep.':(category==='Good Morning'?'Write something energizing and uplifting for a fresh start.':'');
  const styleHint = styleHints[Math.floor(Math.random()*styleHints.length)];
  const weekday = new Date().toLocaleDateString('en-US',{weekday:'long'});
  const prompt = `You are MoodCaster, an English-only Farcaster copywriter.
Mood: ${mood}
Category: ${category}
${hint}
Style: ${styleHint}
Context: Today is ${weekday}.
Write ONE short cast (<= 280 chars) in English only. Friendly tone, no hashtags, no markdown, no financial advice.`;
  const diversityOn = diversity==='high';
  try{
    const r = await groq.chat.completions.create({
      model: MODEL_ID, messages:[{role:'user',content:prompt}],
      temperature: diversityOn?0.95:0.9, top_p: diversityOn?0.98:0.95,
      presence_penalty: diversityOn?0.8:0.6, frequency_penalty: diversityOn?1.0:0.8,
      seed: Math.floor(Math.random()*1e9), max_tokens: 120
    });
    const castText = r.choices?.[0]?.message?.content?.trim() || '';
    return new Response(JSON.stringify({ castText }), { status:200, headers:{'Content-Type':'application/json'} })
  }catch(e:any){
    return new Response(JSON.stringify({ castText:'', error:e?.message||'Unknown error' }), { status:500 })
  }
}