import React from "react";
import { MOODS, MoodKey } from "../constants";

export function MoodGrid(props: {
  selected: MoodKey | null;
  onSelect: (m: MoodKey) => void;
  diverse: boolean;
  onToggleDiverse: (v: boolean) => void;
}) {
  return (
    <div className="mc-card">
      <div className="mc-card-head">
        <div className="mc-card-title">Pick your mood</div>
        <label className="mc-toggle">
          <input
            type="checkbox"
            checked={props.diverse}
            onChange={(e) => props.onToggleDiverse(e.target.checked)}
          />
          <span>More diverse</span>
        </label>
      </div>
      <div className="mc-grid">
        {Object.entries(MOODS).map(([key, m]) => {
          const active = props.selected === key;
          return (
            <button
              key={key}
              className={"mc-tile" + (active ? " mc-tile--active" : "")}
              onClick={() => props.onSelect(key as MoodKey)}
            >
              <div className="mc-emoji">{m.emoji}</div>
              <div className="mc-tile-title">{m.title}</div>
              <div className="mc-tile-desc">{m.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
