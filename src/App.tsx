import React, { useEffect, useMemo, useState } from "react";
import { readyMiniApp, postCastFarcaster, isInMiniApp } from "./lib/farcaster";
import { WalletConnect } from "./components/WalletConnect";
import { AddMiniApp } from "./components/AddMiniApp";
import { OpenInWarpcast } from "./components/OpenInWarpcast";
import { MOODS, CATEGORIES } from "./constants";
import "./styles.css";

type GenResp = { text?: string; error?: string };

const Chip = (p: { label: string; active: boolean; onClick: () => void }) => (
  <button onClick={p.onClick} className={"chip" + (p.active ? " active" : "")}>
    {p.label}
  </button>
);

export default function App() {
  const [inMini, setInMini] = useState(false);
  const [loading, setLoading] = useState(false);

  const [mood, setMood] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [prompt, setPrompt] = useState<string>("");
  const [castText, setCastText] = useState<string>("");

  useEffect(() => {
    document.title = "MoodCaster";
    readyMiniApp();
    (async () => setInMini(await isInMiniApp()))();
  }, []);

  const canGenerate = useMemo(() => !!mood && !!category, [mood, category]);
  const canPost = useMemo(() => !!castText.trim(), [castText]);

  // ====== FIXED: robust JSON parsing & readable errors ======
  async function handleGenerate() {
    if (!canGenerate) {
      alert("Önce mood ve kategori seç.");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt, mood, category }),
      });

      // JSON yerine HTML dönerse (Vercel error page) kırılma olmasın:
      const ct = r.headers.get("content-type") || "";
      let data: any = null;
      if (ct.includes("application/json")) {
        try {
          data = await r.json();
        } catch {
          data = null;
        }
      } else {
        const txt = await r.text().catch(() => "");
        data = { error: txt.slice(0, 200) || "Non-JSON error response" };
      }

      if (!r.ok || data?.error) {
        console.error("generate error:", data?.error || r.statusText);
        alert("Metin oluşturulamadı: " + (data?.error || r.statusText));
        return;
      }

      setCastText((data.text || "").trim());
    } catch (e) {
      console.error(e);
      alert("Metin oluşturma hatası.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePost() {
    const msg = castText.trim();
    if (!msg) {
      alert("Önce metni oluştur veya düzenle.");
      return;
    }
    try {
      const res = await postCastFarcaster(msg);
      if (res?.cancelled) {
        // kullanıcı composer'ı iptal etti
        return;
      }
      alert("Cast composer açıldı / gönderildi.");
    } catch (e) {
      console.error(e);
      alert("Gönderilemedi. Warpcast içinde deneyin.");
    }
  }

  return (
    <div className="container">
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div className="h1">🌙 MoodCaster</div>
        <span className="subtle">Mood → Category → Generate → Post</span>
      </div>

      {!inMini && (
        <div className="card" style={{ display: "grid", gap: 8 }}>
          <div className="subtle">
            Mini-app konteynerinde değilsin. Cast & wallet için Warpcast içinde aç.
          </div>
          <OpenInWarpcast />
        </div>
      )}

      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 8 }}>1) Mood seç</div>
        <div className="row">
          {MOODS.map((m) => (
            <Chip key={m} label={m} active={mood === m} onClick={() => setMood(m)} />
          ))}
        </div>
      </div>

      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 8 }}>2) Kategori seç</div>
        <div className="row">
          {CATEGORIES.map((c) => (
            <Chip
              key={c}
              label={c}
              active={category === c}
              onClick={() => setCategory(c)}
            />
          ))}
        </div>
      </div>

      <div className="card" style={{ display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 700 }}>3) İpucu (opsiyonel)</div>
        <input
          className="input"
          placeholder="öneri: mention ekle, kısa tut, 1 emoji kullan…"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <div>
          <button
            className="btn primary"
            onClick={handleGenerate}
            disabled={!canGenerate || loading}
          >
            {loading ? "Generating…" : "Generate"}
          </button>
        </div>
      </div>

      <div className="card" style={{ display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 700 }}>4) Metin (düzenlenebilir)</div>
        <textarea
          className="textarea"
          placeholder="Generate sonrası burada görünecek…"
          value={castText}
          onChange={(e) => setCastText(e.target.value)}
        />
        <div className="row">
          <button className="btn primary" onClick={handlePost} disabled={!canPost}>
            Post
          </button>
          <AddMiniApp />
        </div>
      </div>

      <div className="divider" />
      <WalletConnect />
    </div>
  );
}
