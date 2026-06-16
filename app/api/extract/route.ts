import Groq from "groq-sdk";
import * as cheerio from "cheerio";
import { NextRequest, NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface Recipe {
  title: string;
  description: string;
  servings: string;
  prepTime: string;
  cookTime: string;
  difficulty: string;
  ingredients: string[];
  steps: string[];
  notes: string | null;
}

// ── Fetch and clean a regular webpage ──────────────────────────────────────
async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) throw new Error(`Failed to fetch page: ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);

  // Remove noise
  $("script, style, nav, footer, header, iframe, noscript, .ad, .ads, .advertisement, .sidebar, .comments").remove();

  // Prioritise structured recipe content
  const recipeSelectors = [
    '[class*="recipe"]',
    '[id*="recipe"]',
    "article",
    "main",
    ".entry-content",
    ".post-content",
  ];

  for (const sel of recipeSelectors) {
    const el = $(sel).first();
    if (el.length && el.text().trim().length > 200) {
      return el.text().replace(/\s+/g, " ").trim().slice(0, 8000);
    }
  }

  // Fallback to full body text
  return $("body").text().replace(/\s+/g, " ").trim().slice(0, 8000);
}

// ── Fetch YouTube page and extract useful text ─────────────────────────────
async function fetchYouTube(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(10000),
  });

  const html = await res.text();
  const $ = cheerio.load(html);

  // Pull title and meta description — YouTube embeds these in <script> tags as JSON
  const title = $("title").text().replace(" - YouTube", "").trim();
  const metaDesc = $('meta[name="description"]').attr("content") ?? "";

  // Extract the initial data JSON that YouTube embeds — contains video description
  const scriptContent = $("script")
    .map((_, el) => $(el).html() ?? "")
    .get()
    .join("\n");

  const descMatch = scriptContent.match(/"shortDescription":"(.*?)"/);
  const description = descMatch
    ? descMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"').slice(0, 4000)
    : metaDesc;

  return `Video title: ${title}\n\nVideo description:\n${description}`.trim();
}

// ── System prompt for Groq ─────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a recipe extraction assistant. You will receive raw text scraped from a recipe webpage or YouTube video description. Extract the recipe and return ONLY valid JSON with no markdown fences, no explanation.

Return exactly this structure:
{
  "title": "Recipe name",
  "description": "One sentence description of the dish",
  "servings": "e.g. Serves 4",
  "prepTime": "e.g. 15 min",
  "cookTime": "e.g. 30 min",
  "difficulty": "Easy | Medium | Hard",
  "ingredients": ["quantity + ingredient", ...],
  "steps": ["Full step text", ...],
  "notes": "Tips or substitutions, or null"
}

Rules:
- Include quantities in every ingredient line.
- Steps should be complete and self-contained.
- If no recipe is present, return: { "error": "No recipe found" }`;

// ── Main handler ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Missing URL" }, { status: 400 });
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "GROQ_API_KEY is not configured" }, { status: 500 });
  }

  const isYouTube = /youtube\.com|youtu\.be/i.test(url);

  let pageText: string;
  try {
    pageText = isYouTube ? await fetchYouTube(url) : await fetchPage(url);
  } catch (err) {
    console.error("Fetch error:", err);
    return NextResponse.json(
      { error: "Could not fetch that URL. The site may be blocking scrapers." },
      { status: 422 }
    );
  }

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1500,
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Extract the recipe from this content:\n\n${pageText}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return NextResponse.json({ error: "Could not parse a recipe from that link." }, { status: 422 });
    }

    const recipe = JSON.parse(jsonMatch[0]);

    if (recipe.error) {
      return NextResponse.json({ error: recipe.error }, { status: 422 });
    }

    return NextResponse.json({ recipe } as { recipe: Recipe });
  } catch (err) {
    console.error("Groq error:", err);
    return NextResponse.json({ error: "AI extraction failed. Please try again." }, { status: 500 });
  }
}
