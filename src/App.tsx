import React, { useEffect, useMemo, useState } from "react";
import { readyMiniApp, postCastFarcaster, isInMiniApp } from "./lib/farcaster";
import { MOODS, CATEGORIES, MAX_CHARS, MoodKey, CategoryKey } from "./constants";
import "./styles.css";

type GenResp = { text?: string; error?: string; fallback?: boolean; detail?: string };

// basit yardımcılar
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchWithTimeoutAndRetry(
  input: RequestInfo | URL,
  init: RequestInit & { timeoutMs?: number } = {},
  retries = 2
) {
  const { timeoutMs = 12000, ...rest } = init;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort("timeout"), timeoutMs);
  try {
    const res = await fetch(input, { ...rest, signal: controller.signal });
    clearTimeout(t);
    return res;
  } catch (err: any) {
    clearTimeout(t);
    if (retries > 0) {
      // backoff: 700ms, 1400ms
      await sleep((3 - retries) * 700);
      return fetchWithTimeoutAndRetry(input, init, retries - 1);
    }
    throw err;
  }
}

const Step = {
  Mood: 0,
  Category: 1,
  Preview: 2,
} as const;
type StepKey = typeof Step[keyof typeof Step];

export default function App() {
  const [inMini, setInMini] = useState(false);

  const [step, setStep] = useState<StepKey>(Step.Mood);
  const [mood, setMood] = useState<MoodKey | null>(null);
  const [category, setCategory] = useState<CategoryKey | null>(null);
  const [diverse, setDiverse] = useState(false);

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "MoodCaster";
    readyMiniApp();
    (async () => setInMini(await isInMiniApp()))();
  }, []);

  const canGenerate = useMemo(() => !!mood && !!category, [mood, category]);
  const charCount = text.length;

  // ---- Generate (timeout + retry + sağlam JSON) ----
  async function generate() {
    if (!canGenerate) return;
    setLoading(true);
    try {
      const res = await fetchWithTimeoutAndRetry(
        "/api/generate",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ mood, category, diverse }),
          timeoutMs: 12000, // her deneme için 12s
        },
        2 // toplam max 3 deneme
      );

      const ct = res.headers.get("content-type") || "";
      let data: any = null;
      if (ct.includes("application/json")) {
        data = await res.json().catch(() => null);
      } else {
        const txt = await res.text().catch(() => "");
        data = { error: txt.slice(0, 200) || "Non-JSON error response" };
      }

      if (!res.ok || data?.error) {
        throw new Error(String(data?.error || res.statusText || "Generate failed"));
      }

      const generated = (data.text || "").trim();
      if (!generated) {
        throw new Error("Boş yanıt alındı");
      }

      setText(generated.slice(0, MAX_CHARS));
      setStep(Step.Preview);
      if (data.fallback) {
        console.warn("AI fallback used", data.detail);
        alert(
          "AI servisine ulaşılamadı, sana varsayılan bir metin önerdik. Daha sonra tekrar dene."
        );
      }
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (msg.toLowerCase().includes("abort") || msg.includes("timeout")) {
        alert("Sunucu yavaş yanıt verdi (timeout). Lütfen tekrar deneyin.");
      } else {
        alert("Metin oluşturulamadı: " + msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handlePost() {
    const t = text.trim().slice(0, MAX_CHARS);
    if (!t) return alert("Önce metni oluştur.");
    try {
      const res = await postCastFarcaster(t);
      if (res?.cancelled) {
        alert("Cast gönderimi iptal edildi.");
        return;
      }
      if (res?.fallback) {
        alert(
          "Warpcast cast oluşturma sayfası açıldı. Metni oradan paylaşabilirsin."
        );
        return;
      }
      alert("Cast composer açıldı / gönderildi.");
    } catch (e) {
      console.error(e);
      alert("Gönderilemedi. Warpcast içinde deneyin.");
    }
  }

  // ---- Tek sayfa akış UI'si (3 adım) ----
  return (
    <div className="flow-root">
      <header className="flow-header">
        <div className="badge">MC</div>
        <div className="titles">
          <div className="title">MoodCaster</div>
          <div className="sub">English-only • Mood → Category → AI Cast → Post</div>
        </div>
        <div className="tabs">
          <button className="tab active">Create</button>
          <button className="tab" disabled>Tasks</button>
        </div>
      </header>

      {!inMini && (
        <div className="info">
          You are viewing outside Warpcast. Posting & wallet work best inside the Mini App.
        </div>
      )}

      {/* STEP 1: MOOD */}
      {step === Step.Mood && (
        <section className="card">
          <div className="card-head">
            <div className="card-title">Pick your mood</div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={diverse}
                onChange={(e) => setDiverse(e.target.checked)}
              />
              <span>More diverse</span>
            </label>
          </div>

          <div className="grid">
            {Object.entries(MOODS).map(([key, m]) => (
              <button
                key={key}
                className={"tile" + (mood === key ? " active" : "")}
                onClick={() => {
                  setMood(key as MoodKey);
                  // sonraki adıma geç
                  setStep(Step.Category);
                }}
              >
                <div className="emoji">{m.emoji}</div>
                <div className="tile-title">{m.title}</div>
                <div className="tile-desc">{m.desc}</div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* STEP 2: CATEGORY */}
      {step === Step.Category && (
        <section className="card">
          <div className="card-head">
            <div className="card-title">
              Pick a category{" "}
              {mood && <span className="chip">{MOODS[mood].title}</span>}
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={diverse}
                onChange={(e) => setDiverse(e.target.checked)}
              />
              <span>More diverse</span>
            </label>
          </div>

          <div className="grid">
            {Object.entries(CATEGORIES).map(([key, c]) => (
              <button
                key={key}
                className={"tile" + (category === key ? " active" : "")}
                onClick={() => {
                  setCategory(key as CategoryKey);
                  setText(""); // her seçimde temizle
                }}
              >
                <div className="emoji">{c.emoji}</div>
                <div className="tile-title">{c.title}</div>
                <div className="tile-desc">{c.desc}</div>
              </button>
            ))}
          </div>

          <div className="row">
            <button className="btn" onClick={() => setStep(Step.Mood)}>← Back</button>
            <div className="row-gap" />
            <button
              className={"btn primary" + (!canGenerate || loading ? " disabled" : "")}
              disabled={!canGenerate || loading}
              onClick={generate}
            >
              {loading ? "Generating…" : "Generate"}
            </button>
          </div>
        </section>
      )}

      {/* STEP 3: PREVIEW/POST */}
      {step === Step.Preview && (
        <section className="card">
          <div className="card-head">
            <div className="card-title">
              Preview &amp; post{" "}
              {mood && <span className="chip">{MOODS[mood].title}</span>}
              {category && <span className="chip">{CATEGORIES[category].title}</span>}
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={diverse}
                onChange={(e) => setDiverse(e.target.checked)}
              />
              <span>More diverse</span>
            </label>
          </div>

          <textarea
            className="textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="row">
            <div className={"count" + (charCount > MAX_CHARS ? " over" : "")}>
              {Math.min(charCount, MAX_CHARS)}/{MAX_CHARS}
            </div>
            <div className="row-gap" />
            <button className="btn" onClick={() => setStep(Step.Category)}>← Back</button>
            <button className="btn" onClick={() => setText("")}>Reset</button>
            <button className="btn" onClick={generate}>↻ Regenerate</button>
            <button className="btn primary" onClick={handlePost}>Post</button>
          </div>
        </section>
      )}

      <footer className="footer">Farcaster Mini App • Built for Base</footer>
    </div>
  );
}
