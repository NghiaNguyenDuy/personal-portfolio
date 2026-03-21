import { prisma } from "@/lib/prisma";
import type { ArticleType } from "@/lib/types";
import { uniqueBy } from "@/lib/utils";

const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

interface SummaryFilters {
  topicSlug: string;
  sourceSlug?: string;
  tagSlug?: string;
  articleType?: ArticleType;
}

export async function generateSummaryForFilters(filters: SummaryFilters) {
  const topic = await prisma.topic.findUnique({ where: { slug: filters.topicSlug } });
  if (!topic) {
    throw new Error("Topic not found.");
  }

  const articles = await prisma.externalArticle.findMany({
    where: {
      isSummaryCandidate: true,
      topic: { slug: filters.topicSlug },
      ...(filters.sourceSlug ? { source: { slug: filters.sourceSlug } } : {}),
      ...(filters.tagSlug ? { tags: { some: { slug: filters.tagSlug } } } : {}),
      ...(filters.articleType ? { articleType: filters.articleType.toUpperCase() as any } : {})
    },
    include: {
      source: true,
      tags: true
    },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    take: topic.articleLimit
  });

  if (!articles.length) {
    throw new Error("No imported articles match the current summary filters.");
  }

  const summary = await buildSummary(topic.name, articles.map((article) => ({
    title: article.title,
    publisher: article.publisher,
    excerpt: article.excerpt ?? "",
    category: article.category,
    url: article.sourceUrl,
    publishedAt: article.publishedAt?.toISOString() ?? new Date().toISOString(),
    tags: article.tags.map((tag) => tag.label)
  })));

  const generatedAt = new Date();
  const uniqueSources = uniqueBy(articles, (article) => article.publisher);
  const articleIds = articles.map((article) => ({ id: article.id }));

  const existing = await prisma.newsSummary.findFirst({ where: { topicId: topic.id }, orderBy: { generatedAt: "desc" } });
  if (existing) {
    await prisma.summarySource.deleteMany({ where: { newsSummaryId: existing.id } });
    await prisma.newsSummary.update({
      where: { id: existing.id },
      data: {
        title: summary.title,
        summary: summary.paragraphs.join("\n\n"),
        generatedAt,
        sourceCount: uniqueSources.length,
        articleCount: articles.length,
        provider: summary.provider,
        model: summary.model,
        freshnessLabel: "Generated just now",
        articles: { set: articleIds },
        sources: {
          create: articles.slice(0, 6).map((article) => ({
            title: article.title,
            publisher: article.publisher,
            url: article.sourceUrl,
            publishedAt: article.publishedAt
          }))
        }
      }
    });
    return existing.id;
  }

  const created = await prisma.newsSummary.create({
    data: {
      topicId: topic.id,
      title: summary.title,
      summary: summary.paragraphs.join("\n\n"),
      generatedAt,
      sourceCount: uniqueSources.length,
      articleCount: articles.length,
      provider: summary.provider,
      model: summary.model,
      freshnessLabel: "Generated just now",
      articles: { connect: articleIds },
      sources: {
        create: articles.slice(0, 6).map((article) => ({
          title: article.title,
          publisher: article.publisher,
          url: article.sourceUrl,
          publishedAt: article.publishedAt
        }))
      }
    }
  });

  return created.id;
}

async function buildSummary(
  topicName: string,
  articles: Array<{ title: string; publisher: string; excerpt: string; category: string; url: string; publishedAt: string; tags: string[] }>
) {
  if (process.env.OPENAI_API_KEY) {
    try {
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
                "You generate concise topic summaries for a portfolio site. Return JSON with keys title and paragraphs. paragraphs must be an array of 2 or 3 short paragraphs."
            },
            {
              role: "user",
              content: JSON.stringify({
                topicName,
                articles: articles.slice(0, 6)
              })
            }
          ]
        })
      });

      if (response.ok) {
        const payload = await response.json();
        const content = payload.choices?.[0]?.message?.content;
        const parsed = typeof content === "string" ? JSON.parse(content) : null;
        const title = typeof parsed?.title === "string" ? parsed.title.trim() : `${topicName} roundup`;
        const paragraphs = Array.isArray(parsed?.paragraphs)
          ? parsed.paragraphs.filter((entry: unknown) => typeof entry === "string" && entry.trim()).slice(0, 3)
          : [];

        if (paragraphs.length) {
          return {
            title,
            paragraphs,
            provider: "Imported sources + OpenAI",
            model: OPENAI_MODEL
          };
        }
      }
    } catch {
      // fall through to deterministic summary
    }
  }

  const topTitles = articles.slice(0, 3).map((article) => article.title);
  return {
    title: `${topicName} roundup: ${topTitles[0] ?? "latest imported signals"}`,
    paragraphs: [
      `Imported ${articles.length} item${articles.length === 1 ? "" : "s"} for ${topicName}, with the strongest signals coming from ${uniqueBy(articles, (article) => article.publisher).map((article) => article.publisher).join(", ")}.`,
      `The current set centers on ${articles.slice(0, 3).map((article) => article.title).join("; ")}.`,
      `This summary was built from stored source imports rather than a live news API search, so the editorial inputs remain traceable and filterable.`
    ],
    provider: "Imported sources fallback",
    model: "deterministic-fallback"
  };
}
