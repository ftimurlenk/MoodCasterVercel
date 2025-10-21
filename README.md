
# MoodCaster — Vercel Functions (EN-only)

Vercel-only deployment. Backend runs on **Vercel Edge Functions** under `/api/*`.

## Local
```bash
npm i
cp .env.example .env.local
# .env.local
# GROQ_API_KEY=gsk_...
# GROQ_MODEL_ID=llama-3.1-8b-instant
npm run dev
# App: http://localhost:5173
# Health: http://localhost:5173/api/health
```
