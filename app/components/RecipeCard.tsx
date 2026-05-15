"use client";

import type { Recipe } from "../api/extract/route";

interface RecipeCardProps {
  recipe: Recipe;
  url: string;
  saved: boolean;
  onSave: () => void;
  onUnsave: () => void;
}

function isYouTube(url: string) {
  return /youtube\.com|youtu\.be/i.test(url);
}

export default function RecipeCard({ recipe, url, saved, onSave, onUnsave }: RecipeCardProps) {
  const isYT = isYouTube(url);

  function copyRecipe() {
    const text = [
      recipe.title,
      recipe.description ?? "",
      "",
      "INGREDIENTS",
      ...(recipe.ingredients ?? []).map((i) => `• ${i}`),
      "",
      "STEPS",
      ...(recipe.steps ?? []).map((s, i) => `${i + 1}. ${s}`),
      recipe.notes ? `\nNotes: ${recipe.notes}` : "",
    ].join("\n");
    navigator.clipboard.writeText(text);
  }

  return (
    <article className="recipe-card">
      {/* Hero */}
      <div className="recipe-hero">
        <span className={`source-badge ${isYT ? "youtube" : "web"}`}>
          {isYT ? "▶ YouTube" : "⊕ Web recipe"}
        </span>
        <h2 className="recipe-title">{recipe.title}</h2>
        {recipe.description && (
          <p className="recipe-description">{recipe.description}</p>
        )}
        <div className="recipe-meta">
          {recipe.servings && (
            <div className="meta-item">
              <span className="meta-label">Serves</span>
              <span className="meta-value">{recipe.servings}</span>
            </div>
          )}
          {recipe.prepTime && (
            <div className="meta-item">
              <span className="meta-label">Prep</span>
              <span className="meta-value">{recipe.prepTime}</span>
            </div>
          )}
          {recipe.cookTime && (
            <div className="meta-item">
              <span className="meta-label">Cook</span>
              <span className="meta-value">{recipe.cookTime}</span>
            </div>
          )}
          {recipe.difficulty && (
            <div className="meta-item">
              <span className="meta-label">Difficulty</span>
              <span className="meta-value">{recipe.difficulty}</span>
            </div>
          )}
        </div>
        <div className="source-link">
          ↗{" "}
          <a href={url} target="_blank" rel="noopener noreferrer">
            View original source
          </a>
        </div>
      </div>

      {/* Body */}
      <div className="recipe-body">
        <div className="ingredients-section">
          <p className="section-heading">Ingredients</p>
          <ul className="ingredient-list">
            {(recipe.ingredients ?? []).map((ing, i) => (
              <li key={i} className="ingredient-item">
                <span className="ingredient-dot" />
                <span>{ing}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="steps-section">
          <p className="section-heading">Method</p>
          <ol className="step-list">
            {(recipe.steps ?? []).map((step, i) => (
              <li key={i} className="step-item">
                <span className="step-num">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Notes */}
      {recipe.notes && (
        <div className="notes-section">
          <div className="notes-inner">
            <strong>Notes —</strong> {recipe.notes}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="recipe-footer">
        <span className="footer-meta">
          {(recipe.ingredients ?? []).length} ingredients ·{" "}
          {(recipe.steps ?? []).length} steps
        </span>
        <div className="footer-actions">
          <button
            className={`save-btn ${saved ? "saved" : ""}`}
            onClick={saved ? onUnsave : onSave}
            title={saved ? "Remove from cookbook" : "Save to cookbook"}
          >
            {saved ? "✦ Saved" : "✦ Save"}
          </button>
          <button className="copy-btn" onClick={copyRecipe}>
            ⎘ Copy
          </button>
        </div>
      </div>
    </article>
  );
}
