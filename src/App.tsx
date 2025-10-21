import React, { useEffect, useMemo, useState } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import { TASKS, markDone, incPosted, getTodayPoints, getTotalPoints, getStreak, ensureToday } from './tasks'

type Step = 1 | 2 | 3
type Tab = 'create' | 'tasks'
const limit = 280

const moods = [
  { key:'Cheerful', icon:'😊', desc:'Upbeat & friendly' },
  { key:'Calm', icon:'🧘', desc:'Gentle & soft' },
  { key:'Focused', icon:'🎯', desc:'Crisp & concise' },
  { key:'Motivational', icon:'⚡', desc:'Action-oriented' },
  { key:'Witty', icon:'😄', desc:'Light humor' },
  { key:'Serious', icon:'🧊', desc:'Neutral & data-driven' }
] as const

const categories = [
  { key:'Good Morning', icon:'☀️' },
  { key:'Good Night', icon:'🌙' },
  { key:'Crypto News', icon:'📈' },
  { key:'Web3 Tip', icon:'🛠️' },
  { key:'Motivation', icon:'💪' },
  { key:'Daily Summary', icon:'📝' },
  { key:'Meme', icon:'😄' },
  { key:'Tech Insight', icon:'💡' },
  { key:'Life Tip', icon:'🌱' },
  { key:'Quote of the Day', icon:'🗣️' },
  { key:'Builder Log', icon:'🧱' },
  { key:'Fun Fact', icon:'🤓' },
  { key:'Chill Vibes', icon:'🌴' },
  { key:'Community Update', icon:'💬' }
] as const

export default function App(){
  const [tab, setTab] = useState<Tab>('create')
  const [step,setStep] = useState<Step>(1)
  const [mood,setMood] = useState<string>('')
  const [category,setCategory] = useState<string>('')
  const [cast,setCast] = useState<string>('')
  const [loading,setLoading] = useState(false)
  const [error,setError] = useState<string>('')
  const [diverse,setDiverse] = useState<boolean>(false)

  useEffect(()=>{ (async()=>{ await sdk.actions.ready(); ensureToday() })() },[])

  const headerTitle = useMemo(()=>{
    if (tab==='tasks') return 'Daily Tasks'
    if(step===1) return 'Pick your mood'
    if(step===2) return 'Pick a category'
    return 'Preview & post'
  },[tab,step])

  async function generateCast(m: string, c: string){
    if (!m || !c) return
    try{
      setLoading(true); setError(''); setCast('Generating…')
      const res = await fetch('/api/generate',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ mood: m, category: c, diversity: diverse ? 'high' : 'default' })
      })
      if(!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as { castText?: string; error?: string }
      const txt = (data.castText ?? '').slice(0,limit)
      if(!txt) throw new Error(data.error || 'Empty response')
      setCast(txt); markDone('generate')
    }catch(e:any){
      console.error('generateCast error', e); setError('Generation failed. Please try again.'); setCast('')
    }finally{ setLoading(false) }
  }

  async function postCast(){
    const text = cast.trim()
    if(!text) return alert('Write something first!')
    await sdk.actions.cast(text)
    alert('✅ Cast posted!')
    incPosted(); markDone('post')
  }

  const todayPts = getTodayPoints()
  const totalPts = getTotalPoints()
  const streak = getStreak()

  const TaskRow = ({k,title,points,desc}:{k:any,title:string,points:number,desc?:string})=>{
    const { day } = ensureToday()
    const done = day.done[k]
    return (
      <div className={`task ${done?'done':''}`}>
        <div className="task-left">
          <div className="check">{done ? '✓' : ''}</div>
          <div>
            <div className="task-title">{title}</div>
            {desc && <div className="task-desc">{desc}</div>}
          </div>
        </div>
        <div className="task-right">
          <span className="points">+{points}</span>
          {!done && k==='checkin' && (<button className="btn tiny" onClick={()=>{ markDone('checkin') }}>Check-in</button>)}
        </div>
      </div>
    )
  }

  return (
    <div className="wrap">
      <header className="bar">
        <div className="mark">MC</div>
        <div className="titles">
          <h1>MoodCaster</h1>
          <p>English-only • Mood → Category → AI Cast → Post</p>
        </div>
      </header>

      <div className="tabs">
        <button className={`tab ${tab==='create'?'active':''}`} onClick={()=>setTab('create')}>Create</button>
        <button className={`tab ${tab==='tasks'?'active':''}`} onClick={()=>setTab('tasks')}>Tasks</button>
      </div>

      <main className="card">
        <div className="head">
          <h2>{headerTitle}</h2>
          {tab==='create' ? (
            <div className="tags">
              {mood && <span className="tag">{mood}</span>}
              {category && <span className="tag">{category}</span>}
              <label className="toggle">
                <input type="checkbox" checked={diverse} onChange={(e)=>setDiverse(e.target.checked)} />
                <span>More diverse</span>
              </label>
            </div>
          ) : (
            <div className="stats">
              <span className="badge">Today: {todayPts} pts</span>
              <span className="badge">Total: {totalPts} pts</span>
              <span className="badge">Streak: {streak} 🔥</span>
            </div>
          )}
        </div>

        {tab==='create' && (
          <>
            {step===1 && (
              <div className="grid">
                {moods.map(m => (
                  <button key={m.key} className={`pill ${mood===m.key?'active':''}`}
                    onClick={()=>{ setMood(m.key); setCategory(''); setCast(''); setStep(2) }}>
                    <span className="emoji">{m.icon}</span>
                    <span className="pill-title">{m.key}</span>
                    <span className="pill-desc">{m.desc}</span>
                  </button>
                ))}
              </div>
            )}

            {step===2 && (
              <div className="grid">
                {categories.map(c => (
                  <button key={c.key} className={`pill ${category===c.key?'active':''}`}
                    onClick={()=>{ setCategory(c.key); setStep(3); generateCast(mood, c.key) }}>
                    <span className="emoji">{c.icon}</span>
                    <span className="pill-title">{c.key}</span>
                    <span className="pill-desc">AI will draft for you</span>
                  </button>
                ))}
              </div>
            )}

            {step===3 && (
              <div className="compose">
                <textarea
                  value={cast}
                  onChange={e=>setCast(e.target.value.slice(0,limit))}
                  placeholder="Your AI cast will appear here…"
                  rows={5}
                  inputMode="text"
                />
                <div className="row">
                  <span className="muted">{cast.length}/{limit}</span>
                  <div className="spacer" />
                  <button className="btn ghost" onClick={()=>{ setStep(1); setMood(''); setCategory(''); setCast('') }}>Reset</button>
                  <button className="btn" disabled={loading} onClick={()=>generateCast(mood, category)}>↻ Regenerate</button>
                  <button className="btn primary" disabled={loading || !cast.trim()} onClick={postCast}>Post</button>
                </div>
                {error && <div className="error">{error}</div>}
              </div>
            )}
          </>
        )}

        {tab==='tasks' && (
          <div className="tasks">
            {TASKS.map(t => (<TaskRow key={t.key} k={t.key} title={t.title} points={t.points} desc={t.desc}/>))}
            <div className="hint">Tip: Posting 3 casts in a day unlocks a bonus.</div>
          </div>
        )}
      </main>

      <footer className="foot">Farcaster Mini App · Built for Base</footer>
    </div>
  )
}