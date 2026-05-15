import type { Recipe } from "../api/extract/route";

export interface SavedRecipe {
  id: string;
  recipe: Recipe;
  url: string;
  savedAt: number; // timestamp
}

const KEY = "cookable_saved_recipes";

export function getSaved(): SavedRecipe[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveRecipe(recipe: Recipe, url: string): SavedRecipe {
  const saved = getSaved();
  const entry: SavedRecipe = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    recipe,
    url,
    savedAt: Date.now(),
  };
  localStorage.setItem(KEY, JSON.stringify([entry, ...saved]));
  return entry;
}

export function unsaveRecipe(id: string): void {
  const saved = getSaved().filter((r) => r.id !== id);
  localStorage.setItem(KEY, JSON.stringify(saved));
}

export function isSaved(url: string): SavedRecipe | undefined {
  return getSaved().find((r) => r.url === url);
}

export function formatSavedAt(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
