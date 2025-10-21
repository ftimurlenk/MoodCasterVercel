import React from "react";

export function Header() {
  return (
    <div className="mc-header">
      <div className="mc-badge">MC</div>
      <div className="mc-titleblock">
        <div className="mc-title">MoodCaster</div>
        <div className="mc-sub">English-only • Mood → Category → AI Cast → Post</div>
      </div>
      <div className="mc-tabs">
        <button className="mc-tab mc-tab--active">Create</button>
        <button className="mc-tab" disabled>Tasks</button>
      </div>
    </div>
  );
}
