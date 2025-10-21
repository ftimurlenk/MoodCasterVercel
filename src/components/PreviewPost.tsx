import React, { useMemo } from "react";
import { MAX_CHARS, MOODS, CATEGORIES, MoodKey, CategoryKey } from "../constants";
import { postCastFarcaster } from "../lib/farcaster";

export function PreviewPost(props: {
  text: string;
  setText: (v: string) => void;
  mood: MoodKey;
  category: CategoryKey;
  onRegenerate: () => void;
}) {
  const count = props.text.length;
  const over = count > MAX_CHARS;

  async function post() {
    const t = props.text.trim().slice(0, MAX_CHARS);
    if (!t) return alert("Boş metin.");
    try {
      const res = await postCastFarcaster(t);
      if (res?.cancelled) return;
      alert("Cast composer açıldı / gönderildi.");
    } catch (e) {
      console.error(e);
      alert("Gönderilemedi. Warpcast içinde deneyin.");
    }
  }

  const header = useMemo(
    () => (
      <>
        <span className="mc-chip">{MOODS[props.mood].title}</span>
        <span className="mc-chip">{CATEGORIES[props.category].title}</span>
      </>
    ),
    [props.mood, props.category]
  );

  return (
    <div className="mc-card">
      <div className="mc-card-head">
        <div className="mc-card-title">Preview &amp; post {header}</div>
        <label className="mc-toggle">
          <input type="checkbox" disabled />
          <span>More diverse</span>
        </label>
      </div>

      <textarea
        className="mc-textarea"
        value={props.text}
        onChange={(e) => props.setText(e.target.value)}
      />

      <div className="mc-row">
        <div className={"mc-count" + (over ? " mc-count--over" : "")}>
          {Math.min(count, MAX_CHARS)}/{MAX_CHARS}
        </div>
        <div className="mc-row-gap" />
        <button className="mc-btn" onClick={() => props.setText("")}>Reset</button>
        <button className="mc-btn" onClick={props.onRegenerate}>↻ Regenerate</button>
        <button className="mc-btn mc-btn--primary" onClick={post}>Post</button>
      </div>
    </div>
  );
}
