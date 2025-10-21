import React, { useEffect, useMemo, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { WalletConnect } from "./components/WalletConnect";
import { AddMiniApp } from "./components/AddMiniApp";
import { OpenInWarpcast } from "./components/OpenInWarpcast";
import { MOODS, CATEGORIES } from "./constants";

type GenResp = { text?: string; error?: string };

export default function App() {
  const [isMiniApp, setIsMiniApp] = useState(false);
  const [loading, setLoading] = useState(false);

  // selections
  const [mood, setMood] = useState<string>("");
  const [category, setCategory] = useState<string>("");

  // output
  const [prompt, setPrompt] = useState<string>(""); // optional user hint
  const [castText, setCastText] = useState<string>("");

  // init
  useEffect(() => {
    (async () => {
      try {
        await sdk.actions.ready();
      } catch (e) {
        console.error("ready() failed", e);
      }
      try {
        const inMini = await (sdk as any).isInMiniApp?.();
        setIsMiniApp(!!inMini);
      } catch {
        setIsMiniApp(false);
      }
      document.title = "MoodCaster";
    })();
  }, []);

  const canGenerate = useMemo(() => !!mood && !!category, [mood, category]);
  const canPost = useMemo(() => !!castText.trim(), [castText]);

  async function hapticSuccess() {
    try {
      const caps = await (sdk as any).getCapabilities?.();
      if (Array.isArray(caps) && caps.includes("haptics.notificationOccurred")) {
        await (sdk as any).haptics?.notificationOccurred?.("success");
      }
    } catch {}
  }

  // ---- GENERATE via /api/generate (Edge) ----
  async function handleGenerate() {
    if (!canGenerate) {
      alert("Önce bir mood ve kategori seç.");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          prompt,
          mood,
          category,
        }),
      });
      const data: GenResp = await r.json();
      if (!r.ok || data?.error) {
        console.error("generate error:", data?.error);
        alert("Metin oluşturulamadı. Birazdan tekrar dene.");
        return;
      }
      setCastText((data.text || "").trim());
      await hapticSuccess();
    } catch (e) {
      console.error(e);
      alert("Metin oluşturma hatası.");
    } finally {
      setLoading(false);
    }
  }

  // ---- POST to Farcaster ----
  async function postCast() {
    const msg = castText.trim();
    if (!msg) return alert("Önce metni oluştur ya da düzenle.");
    try {
      if (sdk.actions.requestPermissions) {
        const granted = await sdk.actions.requestPermissions(["cast"]);
        if (!granted?.includes?.("cast")) {
          throw new Error("Cast permission not granted");
        }
      }
      if (sdk.actions.composeCast) {
        const res = await sdk.actions.composeCast({ text: msg });
        if (res === null) {
          console.log("composer cancelled");
          return;
        }
        await hapticSuccess();
        alert("Cast composer açıldı / gönderildi.");
        return;
      }
      await (sdk as any).actions?.cast?.(msg);
      await hapticSuccess();
      alert("Cast gönderildi!");
    } catch (e) {
      console.error("post failed:", e);
      try {
        await (sdk as any).actions?.openCastComposer?.({ text: msg });
      } catch (e2) {
        console.error("openCastComposer failed", e2);
        if (!isMiniApp) {
          alert("Göndermek için Warpcast içinde aç.");
        } else {
          alert("Gönderilemedi. Tekrar dene.");
        }
      }
    }
  }

  // ---- UI helpers ----
  const Chip = (p: { label: string; active: boolean; onClick: () => void }) => (
    <button
      onClick={p.onClick}
      style={{
        padding: "8px 12px",
        borderRadius: 999,
        border: "1px solid " + (p.active ? "#6e56cf" : "#333"),
        background: p.active ? "#2b235a" : "#111",
        color: "#eee",
        cursor: "pointer",
        fontSize: 14,
      }}
    >
      {p.label}
    </button>
  );

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        maxWidth: 680,
        margin: "24px auto",
        fontFamily: "Inter, system-ui, sans-serif",
        padding: "0 12px",
      }}
    >
      <h1 style={{ margin: 0 }}>MoodCaster 🌙</h1>
      <p style={{ opacity: 0.8, margin: 0 }}>
        Mood → Category → Generate → Post
      </p>

      {!isMiniApp && (
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            border: "1px solid #333",
            background: "#111",
            color: "#eee",
          }}
        >
          <p style={{ margin: 0, fontSize: 13, opacity: 0.9 }}>
            Şu anda mini-app konteynerinde değilsin. Cast atma & cüzdan
            özellikleri Warpcast içinde çalışır.
          </p>
          <div style={{ marginTop: 8 }}>
            <OpenInWarpcast />
          </div>
        </div>
      )}

      {/* Step 1: Mood */}
      <section>
        <div style={{ marginBottom: 6, fontWeight: 600 }}>1) Mood seç:</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {MOODS.map((m) => (
            <Chip
              key={m}
              label={m}
              active={mood === m}
              onClick={() => setMood(m)}
            />
          ))}
        </div>
      </section>

      {/* Step 2: Category */}
      <section>
        <div style={{ marginBottom: 6, fontWeight: 600 }}>
          2) Kategori seç:
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {CATEGORIES.map((c) => (
            <Chip
              key={c}
              label={c}
              active={category === c}
              onClick={() => setCategory(c)}
            />
          ))}
        </div>
      </section>

      {/* Optional prompt */}
      <section>
        <div style={{ marginBottom: 6, fontWeight: 600 }}>
          3) İstersen ipucu (opsiyonel):
        </div>
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="ör. mention ekle, kısa tut, 1 emoji kullan"
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 12,
            border: "1px solid #333",
            background: "#111",
            color: "#eee",
          }}
        />
        <div style={{ marginTop: 10 }}>
          <button
            onClick={handleGenerate}
            disabled={!canGenerate || loading}
            style={{
              padding: "10px 16px",
              borderRadius: 12,
              border: "1px solid #444",
              background: canGenerate ? "#6e56cf" : "#2a2a2a",
              color: "#fff",
              cursor: canGenerate ? "pointer" : "not-allowed",
              opacity: loading ? 0.75 : 1,
            }}
          >
            {loading ? "Generating…" : "Generate"}
          </button>
        </div>
      </section>

      {/* Output / Edit */}
      <section>
        <div style={{ marginBottom: 6, fontWeight: 600 }}>
          4) Metin (düzenlenebilir):
        </div>
        <textarea
          value={castText}
          onChange={(e) => setCastText(e.target.value)}
          rows={6}
          placeholder="Generate sonrası burada göreceksin…"
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 12,
            border: "1px solid #333",
            background: "#111",
            color: "#eee",
          }}
        />
        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={postCast}
            disabled={!canPost}
            style={{
              padding: "10px 16px",
              borderRadius: 12,
              border: "1px solid #444",
              background: canPost ? "#6e56cf" : "#2a2a2a",
              color: "#fff",
              cursor: canPost ? "pointer" : "not-allowed",
            }}
          >
            Post
          </button>
          <AddMiniApp />
        </div>
      </section>

      <div style={{ height: 1, background: "#222", margin: "8px 0" }} />

      <section>
        <div style={{ marginBottom: 6, fontWeight: 600 }}>Wallet</div>
        <WalletConnect />
      </section>
    </div>
  );
}
