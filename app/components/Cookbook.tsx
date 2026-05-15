"use client";

import { useState } from "react";
import type { SavedRecipe } from "../lib/storage";
import { unsaveRecipe, formatSavedAt } from "../lib/storage";
import RecipeCard from "./RecipeCard";

interface CookbookProps {
  saved: SavedRecipe[];
  onUpdate: () => void;
}

export default function Cookbook({ saved, onUpdate }: CookbookProps) {
  const [open, setOpen] = useState<SavedRecipe | null>(null);

  function handleUnsave(id: string) {
    unsaveRecipe(id);
    if (open?.id === id) setOpen(null);
    onUpdate();
  }

  if (saved.length === 0) {
    return (
      <div className="cookbook-empty">
        <div className="empty-icon">📖</div>
        <p>No saved recipes yet.</p>
        <p className="cookbook-empty-sub">
          Extract a recipe and hit <strong>✦ Save</strong> to add it here.
        </p>
      </div>
    );
  }

  if (open) {
    return (
      <div>
        <button className="back-btn" onClick={() => setOpen(null)}>
          ← Back to cookbook
        </button>
        <RecipeCard
          recipe={open.recipe}
          url={open.url}
          saved={true}
          onSave={() => {}}
          onUnsave={() => handleUnsave(open.id)}
        />
      </div>
    );
  }

  return (
    <div>
      <p className="cookbook-count">
        {saved.length} recipe{saved.length !== 1 ? "s" : ""} saved
      </p>
      <div className="cookbook-grid">
        {saved.map((entry) => (
          <button
            key={entry.id}
            className="cookbook-tile"
            onClick={() => setOpen(entry)}
          >
            <div className="tile-top">
              <span className="tile-title">{entry.recipe.title}</span>
              <button
                className="tile-remove"
                title="Remove"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUnsave(entry.id);
                }}
              >
                ✕
              </button>
            </div>
            <p className="tile-desc">{entry.recipe.description}</p>
            <div className="tile-meta">
              {entry.recipe.prepTime && <span>{entry.recipe.prepTime} prep</span>}
              {entry.recipe.cookTime && <span>{entry.recipe.cookTime} cook</span>}
              {entry.recipe.difficulty && <span>{entry.recipe.difficulty}</span>}
            </div>
            <div className="tile-footer">
              <span className="tile-ing">
                {(entry.recipe.ingredients ?? []).length} ingredients
              </span>
              <span className="tile-time">{formatSavedAt(entry.savedAt)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
