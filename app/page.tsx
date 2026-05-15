"use client";

import { useState, useRef, useEffect } from "react";
import type { Recipe } from "./api/extract/route";
import {
  getSaved,
  saveRecipe,
  unsaveRecipe,
  isSaved,
  type SavedRecipe,
} from "./lib/storage";
import RecipeCard from "./components/RecipeCard";
import Cookbook from "./components/Cookbook";

type Tab = "extract" | "cookbook";

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

export default function Home() {
  const [tab, setTab] = useState<Tab>("extract");
  const [url, setUrl] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });
  const [saved, setSaved] = useState<SavedRecipe[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSaved(getSaved());
  }, []);

  function refreshSaved() {
    setSaved(getSaved());
  }

  function handleSave() {
    if (state.status !== "done") return;
    saveRecipe(state.recipe, state.url);
    refreshSaved();
  }

  function handleUnsave() {
    if (state.status !== "done") return;
    const entry = isSaved(state.url);
    if (entry) { unsaveRecipe(entry.id); refreshSaved(); }
  }

  const currentlySaved =
    state.status === "done" ? !!isSaved(state.url) : false;

  const savedCount = saved.length;

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

  return (
    <main className="page">
      <header className="header">
        <h1 className="logo">Cook<span>able</span></h1>
        <p className="tagline">Paste any recipe link or YouTube video — get the recipe instantly</p>
      </header>

      <nav className="tabs">
        <button
          className={`tab-btn ${tab === "extract" ? "active" : ""}`}
          onClick={() => setTab("extract")}
        >
          ✦ Extract
        </button>
        <button
          className={`tab-btn ${tab === "cookbook" ? "active" : ""}`}
          onClick={() => setTab("cookbook")}
        >
          📖 Cookbook
          {savedCount > 0 && <span className="tab-badge">{savedCount}</span>}
        </button>
      </nav>

      {tab === "extract" && (
        <>
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
                <button key={ex.url} className="pill" onClick={() => setUrl(ex.url)}>
                  {ex.label}
                </button>
              ))}
            </div>
          </section>

          {state.status === "error" && (
            <div className="error-box">
              <span>⚠</span>
              <span>{state.message}</span>
            </div>
          )}

          {state.status === "loading" && (
            <div className="loading-state">
              <div className="spinner" />
              <p>Fetching and extracting recipe…</p>
              <small>Usually takes 5–15 seconds</small>
            </div>
          )}

          {state.status === "idle" && (
            <div className="empty-state">
              <div className="empty-icon">🍳</div>
              <p>Your recipe will appear here</p>
            </div>
          )}

          {state.status === "done" && (
            <RecipeCard
              recipe={state.recipe}
              url={state.url}
              saved={currentlySaved}
              onSave={handleSave}
              onUnsave={handleUnsave}
            />
          )}
        </>
      )}

      {tab === "cookbook" && (
        <Cookbook saved={saved} onUpdate={refreshSaved} />
      )}
    </main>
  );
}
