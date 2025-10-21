export type MoodKey =
  | "cheerful"
  | "calm"
  | "focused"
  | "motivational"
  | "witty"
  | "serious";

export const MOODS: Record<
  MoodKey,
  { emoji: string; title: string; desc: string }
> = {
  cheerful: { emoji: "😊", title: "Cheerful", desc: "Upbeat & friendly" },
  calm: { emoji: "🧘", title: "Calm", desc: "Gentle & soft" },
  focused: { emoji: "🎯", title: "Focused", desc: "Crisp & concise" },
  motivational: { emoji: "⚡", title: "Motivational", desc: "Action-oriented" },
  witty: { emoji: "😏", title: "Witty", desc: "Light humor" },
  serious: { emoji: "🧊", title: "Serious", desc: "Neutral & data-driven" },
};

export type CategoryKey =
  | "good_morning"
  | "good_night"
  | "crypto_news"
  | "web3_tip"
  | "motivation"
  | "daily_summary"
  | "meme"
  | "tech_insight"
  | "life_tip"
  | "quote_of_day"
  | "builder_log"
  | "fun_fact"
  | "chill_vibes"
  | "community_update";

export const CATEGORIES: Record<
  CategoryKey,
  { emoji: string; title: string; desc: string }
> = {
  good_morning: { emoji: "🌞", title: "Good Morning", desc: "AI will draft for you" },
  good_night: { emoji: "🌙", title: "Good Night", desc: "AI will draft for you" },
  crypto_news: { emoji: "📰", title: "Crypto News", desc: "AI will draft for you" },
  web3_tip: { emoji: "🛠️", title: "Web3 Tip", desc: "AI will draft for you" },
  motivation: { emoji: "💪", title: "Motivation", desc: "AI will draft for you" },
  daily_summary: { emoji: "🗒️", title: "Daily Summary", desc: "AI will draft for you" },
  meme: { emoji: "😄", title: "Meme", desc: "AI will draft for you" },
  tech_insight: { emoji: "💡", title: "Tech Insight", desc: "AI will draft for you" },
  life_tip: { emoji: "🌿", title: "Life Tip", desc: "AI will draft for you" },
  quote_of_day: { emoji: "🗣️", title: "Quote of the Day", desc: "AI will draft for you" },
  builder_log: { emoji: "📦", title: "Builder Log", desc: "AI will draft for you" },
  fun_fact: { emoji: "🤓", title: "Fun Fact", desc: "AI will draft for you" },
  chill_vibes: { emoji: "🌴", title: "Chill Vibes", desc: "AI will draft for you" },
  community_update: { emoji: "💬", title: "Community Update", desc: "AI will draft for you" },
};

export const MAX_CHARS = 280;
