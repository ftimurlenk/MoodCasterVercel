export type TaskKey = 'checkin' | 'generate' | 'post' | 'bonus3'
export type TaskDef = { key: TaskKey; title: string; points: number; desc?: string }
export const TASKS: TaskDef[] = [
  { key: 'checkin',  title: 'Daily check-in', points: 5,  desc: 'Open the app and check in' },
  { key: 'generate', title: 'Generate a cast', points: 10, desc: 'Create an AI draft' },
  { key: 'post',     title: 'Post a cast',     points: 20, desc: 'Share to Farcaster' },
  { key: 'bonus3',   title: '3 casts in a day',points: 25, desc: 'Post 3 casts today' },
]
const LS_NS = 'moodcaster.tasks.v1'
export type DayProgress = { done: Record<TaskKey, boolean>; postedCount: number }
export type AllProgress = { days: Record<string, DayProgress> }
export const todayKey = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
export const loadAll = (): AllProgress => {
  try { const raw = localStorage.getItem(LS_NS); return raw ? JSON.parse(raw) : { days: {} } }
  catch { return { days: {} } }
}
export const saveAll = (data: AllProgress) => localStorage.setItem(LS_NS, JSON.stringify(data))
export const ensureToday = (): { all: AllProgress; day: DayProgress } => {
  const all = loadAll(); const key = todayKey()
  if (!all.days[key]) { all.days[key] = { done: { checkin:false, generate:false, post:false, bonus3:false }, postedCount: 0 }; saveAll(all) }
  return { all, day: all.days[key] }
}
export const markDone = (t: TaskKey) => { const { all, day } = ensureToday(); day.done[t] = true; if (t==='post' && day.postedCount>=3) day.done.bonus3 = true; saveAll(all) }
export const incPosted = () => { const { all, day } = ensureToday(); day.postedCount += 1; if (day.postedCount>=3) day.done.bonus3 = true; saveAll(all) }
export const getTodayPoints = (): number => { const { day } = ensureToday(); return TASKS.reduce((s,t)=>s+(day.done[t.key]?t.points:0),0) }
export const getTotalPoints = (): number => { const all = loadAll(); return Object.values(all.days).reduce((acc,d)=>acc+TASKS.reduce((s,t)=>s+(d.done[t.key]?t.points:0),0),0) }
export const getStreak = (): number => {
  const all = loadAll(); const hasAny = (k:string)=>{ const d = all.days[k]; return d && Object.values(d.done).some(Boolean) }
  const today = new Date(); let cursor = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())); let streak = 0
  while (true){ const k = cursor.toISOString().substring(0,10); if (!all.days[k] || !hasAny(k)) break; streak++; cursor.setUTCDate(cursor.getUTCDate()-1) }
  return streak
}