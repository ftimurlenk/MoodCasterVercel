import React, { useEffect, useMemo, useState } from "react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { MoodGrid } from "./components/MoodGrid";
import { CategoryGrid } from "./components/CategoryGrid";
import { PreviewPost } from "./components/PreviewPost";
import { CATEGORIES, CategoryKey, MOODS, MoodKey, MAX_CHARS } from "./constants";
import { readyMiniApp, isInMiniApp } from "./lib/farcaster";
import "./styles.css";

type GenResp = { text?: string; error?: string };

export default function App() {
  const [inMini, setInMini] = useState(false);

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

  // ---- Fetch helper with timeout & robust JSON handling ----
  async function callGenerate() {
    if (!canGenerate) return;
    setLoading(true);
    try {
      const controller = new AbortController();
      const to = setTimeout(() => controller.abort("timeout"), 20000);

      const r = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mood,
          category,
          diverse,
        }),
        signal: controller.signal,
      }).catch((e) => {
        throw e;
      });

      clearTimeout(to);

      const ct = r.headers.get("content-type") || "";
      let data: any = null;
      if (ct.includes("application/json")) {
        data = await r.json().catch(() => null);
      } else {
        const txt = await r.text().catch(() => "");
        data = { error: txt.slice(0, 200) || "Non-JSON error response" };
      }

      if (!r.ok || data?.error) {
        console.error("generate error:", data?.error || r.statusText);
        alert("Metin oluşturulamadı: " + (data?.error || r.statusText));
        return;
      }

      setText((data.text || "").trim().slice(0, MAX_CHARS));
    } catch (err: any) {
      if (String(err).includes("AbortError") || String(err).includes("timeout")) {
        alert("Sunucu yavaş yanıt verdi (timeout). Tekrar dene.");
      } else {
        console.error(err);
        alert("Metin oluşturma hatası.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mc-root">
      <Header />

      <div className="mc-page">
        {/* step 1: mood */}
        <MoodGrid
          selected={mood}
          onSelect={(m) => { setMood(m); setCategory(null); setText(""); }}
          diverse={diverse}
          onToggleDiverse={setDiverse}
        />

        {/* step 2: category (shows selected mood chip) */}
        <CategoryGrid
          selected={category}
          onSelect={(c) => { setCategory(c); setText(""); }}
          mood={mood}
          diverse={diverse}
          onToggleDiverse={setDiverse}
        />

        {/* step 3: preview/post */}
        <div style={{ opacity: canGenerate ? 1 : 0.6, pointerEvents: canGenerate ? "auto" : "none" }}>
          <PreviewPost
            text={text}
            setText={setText}
            mood={mood || "calm"}
            category={category || "tech_insight"}
            onRegenerate={callGenerate}
          />
        </div>

        {!inMini && (
          <div className="mc-info">
            You are viewing outside Warpcast. Posting works best inside the Mini App.
          </div>
        )}
      </div>

      <Footer />

      <div className="mc-generate-bar">
        <button
          className={"mc-btn mc-btn--primary" + (!canGenerate || loading ? " mc-btn--disabled" : "")}
          onClick={callGenerate}
          disabled={!canGenerate || loading}
        >
          {loading ? "Generating…" : "Generate"}
        </button>
      </div>
    </div>
  );
}
