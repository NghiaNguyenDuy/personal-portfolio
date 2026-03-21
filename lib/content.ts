import { z } from "zod";

export const READING_CATEGORIES = [
  "AI",
  "Architecture",
  "Web",
  "Data",
  "Engineering Practice",
  "Career"
] as const;

export const SOURCE_TYPES = ["rss", "atom", "blog-index", "manual"] as const;

export const postInputSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3),
  summary: z.string().min(12),
  body: z.string().min(50),
  tags: z.string(),
  categories: z.string(),
  readingMinutes: z.coerce.number().int().positive(),
  status: z.enum(["draft", "published", "archived"]).default("draft")
});

export const commentInputSchema = z.object({
  postSlug: z.string().min(1),
  body: z.string().min(3).max(500),
  parentId: z.string().optional()
});

export const readingArticleSchema = z.object({
  sourceUrl: z.string().url(),
  title: z.string().trim().optional().or(z.literal("")),
  publisher: z.string().trim().optional().or(z.literal("")),
  category: z.enum(READING_CATEGORIES).optional().or(z.literal("")),
  note: z.string().trim().optional().or(z.literal("")),
  articleType: z.enum(["blog", "news"]).default("blog")
});

export const contentSourceSchema = z.object({
  name: z.string().min(2),
  sourceUrl: z.string().url(),
  feedUrl: z.string().url().optional().or(z.literal("")),
  sourceType: z.enum(SOURCE_TYPES).default("blog-index"),
  defaultTopicSlug: z.string().optional().or(z.literal(""))
});

export const summaryGenerationSchema = z.object({
  topicSlug: z.string().min(1),
  sourceSlug: z.string().optional().or(z.literal("")),
  tagSlug: z.string().optional().or(z.literal("")),
  articleType: z.enum(["blog", "news"]).optional().or(z.literal(""))
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});
