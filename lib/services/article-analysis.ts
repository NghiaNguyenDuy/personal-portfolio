import { READING_CATEGORIES } from "@/lib/content";
import type { ArticleAnalysisStatus, ArticleType } from "@/lib/types";
import { slugify, uniqueBy } from "@/lib/utils";

interface AnalysisOverrides {
  title?: string;
  publisher?: string;
  category?: string;
  note?: string;
}

interface AnalyzeExternalArticleInput {
  sourceUrl: string;
  articleType?: ArticleType;
  overrides?: AnalysisOverrides;
}

interface FetchResult {
  url: string;
  html: string;
}

interface ExtractedArticle {
  url: string;
  title: string;
  publisher: string;
  excerpt: string;
  bodyText: string;
  publishedAt?: string;
  domain: string;
}

interface OpenAIResult {
  note: string;
  category: string;
  tags: string[];
}

export interface AnalyzedArticle {
  sourceUrl: string;
  title: string;
  publisher: string;
  excerpt: string;
  note: string;
  category: string;
  tags: string[];
  articleType: ArticleType;
  publishedAt?: string;
  domain: string;
  analysisStatus: ArticleAnalysisStatus;
  analysisProvider: string;
  analyzedAt: string;
  analysisError?: string;
}

const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
const MAX_CONTENT_CHARS = 8000;

export async function analyzeExternalArticle(input: AnalyzeExternalArticleInput): Promise<AnalyzedArticle> {
  const normalizedUrl = normalizeSourceUrl(input.sourceUrl);
  const fetched = await fetchArticleHtml(normalizedUrl);
  const extracted = extractArticle(fetched);
  const articleType = detectArticleType(normalizedUrl, input.articleType);
  const analyzedAt = new Date().toISOString();

  let note = buildFallbackNote(extracted);
  let category = pickCategory(extracted);
  let tags = buildFallbackTags(extracted, category);
  let analysisStatus: ArticleAnalysisStatus = "fallback";
  let analysisProvider = "metadata-fallback";
  let analysisError: string | undefined;

  if (process.env.OPENAI_API_KEY) {
    try {
      const generated = await generateWithOpenAI(extracted);
      note = generated.note;
      category = generated.category;
      tags = generated.tags;
      analysisStatus = "generated";
      analysisProvider = `OpenAI ${OPENAI_MODEL}`;
    } catch (error) {
      analysisError = error instanceof Error ? error.message : "OpenAI article analysis failed.";
    }
  }

  return {
    sourceUrl: normalizedUrl,
    title: input.overrides?.title?.trim() || extracted.title,
    publisher: input.overrides?.publisher?.trim() || extracted.publisher,
    excerpt: extracted.excerpt,
    note: input.overrides?.note?.trim() || note,
    category: sanitizeCategory(input.overrides?.category || category, extracted),
    tags: sanitizeTags(tags, extracted, category),
    articleType,
    publishedAt: extracted.publishedAt,
    domain: extracted.domain,
    analysisStatus,
    analysisProvider,
    analyzedAt,
    analysisError
  };
}

export function normalizeTagLabels(labels: string[]) {
  return uniqueBy(
    labels
      .map((label) => label.trim())
      .filter(Boolean)
      .slice(0, 5),
    (label) => slugify(label)
  ).map((label) => ({
    slug: slugify(label),
    label
  }));
}

function normalizeSourceUrl(value: string) {
  let url: URL;

  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("Enter a valid article URL.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only http and https article URLs are supported.");
  }

  url.hash = "";
  return url.toString();
}

async function fetchArticleHtml(url: string): Promise<FetchResult> {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "PortfolioBot/1.0 (+http://localhost)"
    },
    redirect: "follow"
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch article content (${response.status}).`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
    throw new Error("The URL did not return an HTML article page.");
  }

  return {
    url: response.url,
    html: await response.text()
  };
}

function extractArticle(result: FetchResult): ExtractedArticle {
  const url = new URL(result.url);
  const html = result.html;
  const bodyText = extractReadableText(html);

  if (bodyText.length < 280) {
    throw new Error("The article page was readable, but not enough article text could be extracted.");
  }

  const title =
    findMetaContent(html, ["property", "og:title"]) ??
    findMetaContent(html, ["name", "twitter:title"]) ??
    extractTagContent(html, "title") ??
    startCaseFromSlug(url.pathname) ??
    url.hostname;

  const publisher =
    findMetaContent(html, ["property", "og:site_name"]) ??
    findMetaContent(html, ["name", "application-name"]) ??
    findMetaContent(html, ["name", "publisher"]) ??
    prettifyHostname(url.hostname);

  const excerpt =
    findMetaContent(html, ["name", "description"]) ??
    findMetaContent(html, ["property", "og:description"]) ??
    firstSentence(bodyText);

  const publishedAt =
    findMetaContent(html, ["property", "article:published_time"]) ??
    findTimeDateTime(html) ??
    undefined;

  return {
    url: result.url,
    title: cleanText(title),
    publisher: cleanText(publisher),
    excerpt: cleanText(excerpt).slice(0, 280),
    bodyText: cleanText(bodyText).slice(0, MAX_CONTENT_CHARS),
    publishedAt: publishedAt && isValidDateString(publishedAt) ? new Date(publishedAt).toISOString() : undefined,
    domain: url.hostname
  };
}

function detectArticleType(sourceUrl: string, override?: ArticleType): ArticleType {
  if (override) {
    return override;
  }

  return /\/news\//i.test(sourceUrl) ? "news" : "blog";
}

function extractReadableText(html: string) {
  const articleLike =
    extractTagContent(html, "article") ??
    extractTagContent(html, "main") ??
    extractTagContent(html, "body") ??
    html;

  return decodeHtmlEntities(
    articleLike
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  );
}

function extractTagContent(html: string, tagName: string) {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = html.match(regex);
  return match?.[1]?.trim();
}

function findMetaContent(html: string, [attribute, value]: [string, string]) {
  const regex = new RegExp(`<meta[^>]+${attribute}=["']${escapeRegExp(value)}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i");
  const reverseRegex = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${attribute}=["']${escapeRegExp(value)}["'][^>]*>`, "i");
  const match = html.match(regex) ?? html.match(reverseRegex);
  return match?.[1]?.trim();
}

function findTimeDateTime(html: string) {
  const match = html.match(/<time[^>]+datetime=["']([^"']+)["'][^>]*>/i);
  return match?.[1]?.trim();
}

function cleanText(value: string) {
  return decodeHtmlEntities(value)
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function startCaseFromSlug(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const last = parts.at(-1);
  if (!last) {
    return undefined;
  }

  return last
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function prettifyHostname(hostname: string) {
  return hostname
    .replace(/^www\./, "")
    .split(".")
    .slice(0, -1)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function firstSentence(text: string) {
  const match = text.match(/(.+?[.!?])\s/);
  return (match?.[1] ?? text).slice(0, 220);
}

function isValidDateString(value?: string) {
  if (!value) {
    return false;
  }

  return !Number.isNaN(new Date(value).getTime());
}

function buildFallbackNote(article: ExtractedArticle) {
  const snippet = article.excerpt || firstSentence(article.bodyText);
  return `Saved from ${article.publisher}. ${snippet}`.slice(0, 240);
}

function pickCategory(article: Pick<ExtractedArticle, "title" | "excerpt" | "bodyText">) {
  const haystack = `${article.title} ${article.excerpt} ${article.bodyText}`.toLowerCase();

  if (matchesAny(haystack, ["llm", "ai", "openai", "anthropic", "prompt", "inference", "agent"])) {
    return "AI";
  }
  if (matchesAny(haystack, ["warehouse", "analytics", "etl", "pipeline", "database", "streaming", "lakehouse"])) {
    return "Data";
  }
  if (matchesAny(haystack, ["next.js", "react", "frontend", "browser", "css", "web", "server rendering", "ui"])) {
    return "Web";
  }
  if (matchesAny(haystack, ["architecture", "system design", "distributed", "cache", "caching", "api", "backend", "scalability"])) {
    return "Architecture";
  }
  if (matchesAny(haystack, ["career", "leadership", "manager", "interview", "hiring", "resume", "mentoring"])) {
    return "Career";
  }

  return "Engineering Practice";
}

function buildFallbackTags(article: Pick<ExtractedArticle, "title" | "excerpt" | "bodyText">, category: string) {
  const haystack = `${article.title} ${article.excerpt} ${article.bodyText}`.toLowerCase();
  const tags = new Set<string>();

  const addIf = (label: string, terms: string[]) => {
    if (matchesAny(haystack, terms)) {
      tags.add(label);
    }
  };

  addIf("Lakehouse", ["lakehouse"]);
  addIf("Data Infra", ["data infra", "data platform", "warehouse", "governance", "etl"]);
  addIf("Vector DB", ["vector", "embedding", "retrieval"]);
  addIf("React", ["react"]);
  addIf("Server Rendering", ["server rendering", "ssr", "partial prerendering"]);
  addIf("Evaluation", ["evaluation", "eval", "regression"]);
  addIf("Model Routing", ["routing", "model routing"]);
  addIf("Caching", ["cache", "caching", "revalidation"]);
  tags.add(category);

  return Array.from(tags).slice(0, 4);
}

function matchesAny(haystack: string, terms: string[]) {
  return terms.some((term) => haystack.includes(term));
}

function sanitizeCategory(category: string, article: Pick<ExtractedArticle, "title" | "excerpt" | "bodyText">) {
  return READING_CATEGORIES.includes(category as (typeof READING_CATEGORIES)[number]) ? category : pickCategory(article);
}

function sanitizeTags(tags: string[], article: Pick<ExtractedArticle, "title" | "excerpt" | "bodyText">, category: string) {
  const fallback = buildFallbackTags(article, category);
  const merged = tags.length ? tags : fallback;
  return normalizeTagLabels(merged).map((tag) => tag.label);
}

async function generateWithOpenAI(article: ExtractedArticle): Promise<OpenAIResult> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You analyze saved reading links for a private admin dashboard. Return strict JSON with keys note, category, and tags. The note must be one concise sentence under 220 characters. The category must be one of: AI, Architecture, Web, Data, Engineering Practice, Career. Tags must be an array of 2 to 4 short labels."
        },
        {
          role: "user",
          content: JSON.stringify({
            title: article.title,
            publisher: article.publisher,
            excerpt: article.excerpt,
            bodyText: article.bodyText.slice(0, 4000)
          })
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed (${response.status}).`);
  }

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;
  const parsed = typeof content === "string" ? JSON.parse(content) : null;
  const note = typeof parsed?.note === "string" ? parsed.note.trim() : "";
  const category = typeof parsed?.category === "string" ? parsed.category.trim() : "";
  const tags = Array.isArray(parsed?.tags) ? parsed.tags.filter((entry: unknown): entry is string => typeof entry === "string") : [];

  if (!note) {
    throw new Error("OpenAI did not return a note.");
  }

  if (!READING_CATEGORIES.includes(category as (typeof READING_CATEGORIES)[number])) {
    throw new Error("OpenAI returned an invalid category.");
  }

  return {
    note: note.slice(0, 220),
    category,
    tags
  };
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

