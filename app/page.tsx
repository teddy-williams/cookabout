"use client";

import { useState, useRef } from "react";
import type { Recipe } from "./api/extract/route";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; recipe: Recipe; url: string };

const EXAMPLES = [
  { label: "▶ YouTube pasta", url: "https://www.youtube.com/watch?v=_JESMCH7UoY" },
  { label: "Allrecipes meatballs", url: "https://www.allrecipes.com/recipe/24074/alysias-basic-meatball/" },
  { label: "Bon Appétit cookies", url: "https://www.bonappetit.com/recipe/bas-best-chocolate-chip-cookies" },
];

function isYouTube(url: string) {
  return /youtube\.com|youtu\.be/i.test(url);
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function extract() {
    const trimmed = url.trim();
    if (!trimmed) { inputRef.current?.focus(); return; }
    if (!trimmed.startsWith("http")) {
      setState({ status: "error", message: "Please enter a valid URL starting with https://" });
      return;
    }

    setState({ status: "loading" });

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setState({ status: "error", message: data.error || "Something went wrong." });
      } else {
        setState({ status: "done", recipe: data.recipe, url: trimmed });
      }
    } catch {
      setState({ status: "error", message: "Network error — please try again." });
    }
  }

  function copyRecipe() {
    if (state.status !== "done") return;
    const r = state.recipe;
    const text = [
      r.title,
      r.description ?? "",
      "",
      "INGREDIENTS",
      ...(r.ingredients ?? []).map((i) => `• ${i}`),
      "",
      "STEPS",
      ...(r.steps ?? []).map((s, i) => `${i + 1}. ${s}`),
      r.notes ? `\nNotes: ${r.notes}` : "",
    ].join("\n");

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <main className="page">
      {/* Header */}
      <header className="header">
        <h1 className="logo">Cook<span>able</span></h1>
        <p className="tagline">Paste any recipe link or YouTube video — get the recipe instantly</p>
      </header>

      {/* Input */}
      <section className="input-section">
        <div className="input-row">
          <input
            ref={inputRef}
            className="url-input"
            type="url"
            placeholder="https://youtu.be/... or any recipe website"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && extract()}
            autoComplete="off"
          />
          <button
            className="extract-btn"
            onClick={extract}
            disabled={state.status === "loading"}
          >
            {state.status === "loading" ? "Extracting…" : "✦ Extract"}
          </button>
        </div>

        <div className="examples">
          <span className="examples-label">Try:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.url}
              className="pill"
              onClick={() => setUrl(ex.url)}
            >
              {ex.label}
            </button>
          ))}
        </div>
      </section>

      {/* Error */}
      {state.status === "error" && (
        <div className="error-box">
          <span>⚠</span>
          <span>{state.message}</span>
        </div>
      )}

      {/* Loading */}
      {state.status === "loading" && (
        <div className="loading-state">
          <div className="spinner" />
          <p>{isYouTube(url) ? "Fetching video and extracting recipe…" : "Fetching page and extracting recipe…"}</p>
          <small>Usually takes 5–15 seconds</small>
        </div>
      )}

      {/* Empty */}
      {state.status === "idle" && (
        <div className="empty-state">
          <div className="empty-icon">🍳</div>
          <p>Your recipe will appear here</p>
        </div>
      )}

      {/* Recipe */}
      {state.status === "done" && (() => {
        const { recipe, url: sourceUrl } = state;
        const isYT = isYouTube(sourceUrl);
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
                ↗ <a href={sourceUrl} target="_blank" rel="noopener noreferrer">View original source</a>
              </div>
            </div>

            {/* Ingredients + Steps */}
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
                {(recipe.ingredients ?? []).length} ingredients · {(recipe.steps ?? []).length} steps
              </span>
              <button className={`copy-btn ${copied ? "copied" : ""}`} onClick={copyRecipe}>
                {copied ? "✓ Copied!" : "⎘ Copy recipe"}
              </button>
            </div>
          </article>
        );
      })()}
    </main>
  );
}
