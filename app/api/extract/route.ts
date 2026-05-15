import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

const SYSTEM_PROMPT = `You are a recipe extraction assistant. Given a URL, use the web_search tool to fetch the page or video details, then extract the recipe. 

Always respond with ONLY valid JSON — no markdown fences, no preamble, no explanation.

Return exactly this structure:
{
  "title": "Recipe name",
  "description": "One sentence description of the dish",
  "servings": "e.g. Serves 4",
  "prepTime": "e.g. 15 min",
  "cookTime": "e.g. 30 min",
  "difficulty": "Easy | Medium | Hard",
  "ingredients": ["amount + ingredient name", ...],
  "steps": ["Full step description", ...],
  "notes": "Optional tips, substitutions, or serving suggestions — or null if none"
}

Rules:
- For YouTube videos, search for the video title and channel to identify the recipe, then extract the full ingredient list and steps.
- Include quantities in every ingredient (e.g. "2 cups all-purpose flour", "1 tbsp olive oil").
- Steps should be complete sentences with enough detail to follow without the original source.
- If you cannot identify a recipe from the URL, return: { "error": "No recipe found at this URL" }`;

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Missing URL" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const isYouTube = /youtube\.com|youtu\.be/i.test(url);
  const userMessage = isYouTube
    ? `Extract the full recipe from this YouTube video: ${url}\n\nSearch for this video's content, identify the dish being cooked, and extract all ingredients and steps.`
    : `Extract the full recipe from this URL: ${url}\n\nFetch the page and extract all ingredients and cooking steps.`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: [{ type: "web_search_20250305", name: "web_search" }] as any,
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    const rawText = (textBlock as { type: "text"; text: string } | undefined)?.text ?? "";

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Could not parse a recipe from that link." },
        { status: 422 }
      );
    }

    const recipe = JSON.parse(jsonMatch[0]);

    if (recipe.error) {
      return NextResponse.json({ error: recipe.error }, { status: 422 });
    }

    return NextResponse.json({ recipe } as { recipe: Recipe });
  } catch (err) {
    console.error("Extraction error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}