# Cookable 🍳

> Extract any recipe from any link — instantly.

Paste a recipe URL or YouTube video link and Cookable uses AI to fetch the page, identify the dish, and return a clean, structured recipe with ingredients, steps, timings, and notes. No ads, no blog posts, no scrolling.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Anthropic](https://img.shields.io/badge/Powered%20by-Claude-orange?style=flat-square)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat-square&logo=vercel)

---

## Features

- **🔗 Any URL** — Paste links from Allrecipes, Bon Appétit, NYT Cooking, or any recipe site
- **▶ YouTube support** — Works with cooking videos; Claude identifies the dish and extracts the full recipe
- **📖 Cookbook** — Save recipes locally and browse them anytime in a personal cookbook
- **⎘ Copy to clipboard** — One click copies the full recipe as clean plain text
- **⚡ Fast** — Extracts in 5–15 seconds using Claude's web search tool

---

## Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 14](https://nextjs.org) (App Router) |
| Language | TypeScript |
| AI | [Anthropic Claude](https://anthropic.com) (`claude-sonnet-4`) with web search |
| Styling | Vanilla CSS (no UI library) |
| Storage | `localStorage` (no database, no login) |
| Deployment | [Vercel](https://vercel.com) |

---

## How It Works

1. User pastes a URL into the input
2. The frontend calls `/api/extract` with the URL
3. The API route sends the URL to Claude (`claude-sonnet-4`) with the **web search tool** enabled
4. Claude fetches the page (or YouTube video details), identifies the recipe, and returns structured JSON
5. The frontend renders the recipe card with ingredients, steps, timings, and notes

The API key lives server-side only — it is never exposed to the browser.

---

## Roadmap

- [x] Recipe extraction from any URL
- [x] YouTube video support
- [x] Save & Collect (personal cookbook)
- [ ] Shopping list mode
- [ ] Ingredient substitutions
- [ ] Serving size scaler
- [ ] Meal planner

---

## License

MIT
