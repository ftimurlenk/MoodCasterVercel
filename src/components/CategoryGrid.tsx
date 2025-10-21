import React from "react";
import { CATEGORIES, CategoryKey, MOODS, MoodKey } from "../constants";

export function CategoryGrid(props: {
  selected: CategoryKey | null;
  onSelect: (c: CategoryKey) => void;
  mood: MoodKey | null;
  diverse: boolean;
  onToggleDiverse: (v: boolean) => void;
}) {
  const moodLabel = props.mood ? MOODS[props.mood].title : "—";
  return (
    <div className="mc-card">
      <div className="mc-card-head">
        <div className="mc-card-title">
          Pick a category <span className="mc-chip">{moodLabel}</span>
        </div>
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
        {Object.entries(CATEGORIES).map(([key, c]) => {
          const active = props.selected === key;
          return (
            <button
              key={key}
              className={"mc-tile" + (active ? " mc-tile--active" : "")}
              onClick={() => props.onSelect(key as CategoryKey)}
            >
              <div className="mc-emoji">{c.emoji}</div>
              <div className="mc-tile-title">{c.title}</div>
              <div className="mc-tile-desc">{c.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
