import { prisma } from "@/lib/prisma";
import { cleanDisplayText } from "@/lib/text-cleanup";
import { slugify, uniqueBy } from "@/lib/utils";
import { ensureSourceRegistryTopic, SOURCE_REGISTRY_TOPIC } from "@/lib/services/source-ingestion";

interface PreparedSummarySourceInput {
  title?: unknown;
  publisher?: unknown;
  url?: unknown;
  publishedAt?: unknown;
  excerpt?: unknown;
  category?: unknown;
  articleType?: unknown;
  sourceSlug?: unknown;
  tags?: unknown;
}

interface PreparedSummaryInput {
  topicSlug?: unknown;
  title?: unknown;
  paragraphs?: unknown;
  summary?: unknown;
  sources?: unknown;
  provider?: unknown;
  model?: unknown;
  freshnessLabel?: unknown;
}

export interface PreparedNewsPayload {
  customMessage?: unknown;
  provider?: unknown;
  model?: unknown;
  summaries?: unknown;
  preparedSummaries?: unknown;
}

interface ContentSourceMatch {
  id: string;
  slug: string;
  name: string;
  sourceUrl: string;
}

const DEFAULT_CUSTOM_MESSAGE =
  "Use active source registry entries as the evidence base. Prefer source-backed engineering signals, cite every included source, and keep the overview concise.";

export async function getNewsWorkflowContext() {
  const [topics, sources, recentArticles] = await Promise.all([
    prisma.topic.findMany({
      where: { isTracked: true },
      select: {
        slug: true,
        name: true,
        description: true,
        articleLimit: true
      },
      orderBy: { name: "asc" }
    }),
    prisma.contentSource.findMany({
      where: { isActive: true },
      select: {
        slug: true,
        name: true,
        sourceUrl: true,
        feedUrl: true,
        sourceType: true,
        lastCheckedAt: true,
        lastImportedAt: true,
        lastError: true,
        defaultTopic: {
          select: {
            slug: true,
            name: true
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.externalArticle.findMany({
      select: {
        title: true,
        publisher: true,
        sourceUrl: true,
        excerpt: true,
        publishedAt: true,
        importedAt: true,
        topic: { select: { slug: true } },
        source: { select: { slug: true, name: true } },
        tags: { select: { label: true } }
      },
      orderBy: [{ publishedAt: "desc" }, { importedAt: "desc" }],
      take: 24
    })
  ]);

  return {
    ok: true,
    customMessage: process.env.NEWS_WORKFLOW_MESSAGE ?? process.env.NEWS_SUMMARY_PROMPT ?? DEFAULT_CUSTOM_MESSAGE,
    preferredTopicSlug: topics[0]?.slug ?? SOURCE_REGISTRY_TOPIC.slug,
    topics: topics.map((topic) => ({
      slug: topic.slug,
      name: topic.name,
      description: topic.description,
      articleLimit: topic.articleLimit
    })),
    sources: sources.map((source) => ({
      slug: source.slug,
      name: source.name,
      sourceUrl: source.sourceUrl,
      feedUrl: source.feedUrl,
      sourceType: source.sourceType.toLowerCase().replace("_", "-"),
      defaultTopicSlug: source.defaultTopic?.slug ?? SOURCE_REGISTRY_TOPIC.slug,
      defaultTopicName: source.defaultTopic?.name ?? SOURCE_REGISTRY_TOPIC.name,
      lastCheckedAt: source.lastCheckedAt?.toISOString() ?? null,
      lastImportedAt: source.lastImportedAt?.toISOString() ?? null,
      lastError: source.lastError
    })),
    recentArticles: recentArticles.map((article) => ({
      title: article.title,
      publisher: article.publisher,
      url: article.sourceUrl,
      excerpt: article.excerpt,
      publishedAt: article.publishedAt?.toISOString() ?? article.importedAt.toISOString(),
      topicSlug: article.topic?.slug ?? null,
      sourceSlug: article.source?.slug ?? null,
      sourceName: article.source?.name ?? null,
      tags: article.tags.map((tag) => tag.label)
    })),
    preparedSummarySchema: {
      mode: "prepared",
      provider: "Codex automation",
      model: "codex",
      summaries: [
        {
          topicSlug: "source-registry",
          title: "Short source-backed overview title",
          paragraphs: ["Two or three concise paragraphs grounded in the listed source URLs."],
          sources: [
            {
              title: "Source article title",
              publisher: "Publisher or source registry name",
              url: "https://example.com/article",
              publishedAt: "2026-05-09T00:00:00.000Z",
              excerpt: "One sentence on why this source matters.",
              sourceSlug: "optional-source-slug",
              tags: ["Data Infra", "Platform Ops"]
            }
          ]
        }
      ]
    }
  };
}

export async function savePreparedNewsSummaries(payload: PreparedNewsPayload) {
  const rawSummaries = Array.isArray(payload.summaries)
    ? payload.summaries
    : Array.isArray(payload.preparedSummaries)
      ? payload.preparedSummaries
      : [];

  if (!rawSummaries.length) {
    throw new Error("Prepared summary payload must include at least one summary.");
  }

  const sourceMatches = await prisma.contentSource.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      sourceUrl: true
    }
  });
  const results = [];

  for (const rawSummary of rawSummaries) {
    try {
      const summaryId = await savePreparedSummary(
        rawSummary as PreparedSummaryInput,
        sourceMatches,
        {
          provider: asOptionalString(payload.provider) ?? "Codex automation",
          model: asOptionalString(payload.model) ?? "codex-prepared-summary"
        }
      );

      results.push({
        topic: normalizeTopicSlug((rawSummary as PreparedSummaryInput).topicSlug),
        ok: true,
        summaryId,
        message: "Prepared summary saved."
      });
    } catch (error) {
      results.push({
        topic: normalizeTopicSlug((rawSummary as PreparedSummaryInput).topicSlug),
        ok: false,
        summaryId: null,
        message: error instanceof Error ? error.message : "Unable to save prepared summary."
      });
    }
  }

  const failedTopics = results.filter((result) => !result.ok).map((result) => result.topic);
  const topicSlugs = uniqueBy(results.map((result) => ({ slug: result.topic })), (item) => item.slug).map((item) => item.slug);

  return {
    ok: failedTopics.length === 0,
    mode: "prepared",
    message: failedTopics.length
      ? `Prepared summary failed for ${failedTopics.join(", ")}.`
      : "Prepared news summaries saved.",
    summaries: results,
    failedTopics,
    topicSlugs
  };
}

async function savePreparedSummary(
  input: PreparedSummaryInput,
  sourceMatches: ContentSourceMatch[],
  defaults: { provider: string; model: string }
) {
  const topic = await resolveTopic(normalizeTopicSlug(input.topicSlug));
  const sources = normalizeSources(input.sources);
  if (!sources.length) {
    throw new Error("Prepared summary requires at least one source citation.");
  }

  const paragraphs = normalizeParagraphs(input.paragraphs ?? input.summary);
  if (!paragraphs.length) {
    throw new Error("Prepared summary requires at least one paragraph.");
  }

  const savedArticles = [];
  const generatedAt = new Date();

  for (const source of sources) {
    const matchedSource = matchSource(source, sourceMatches);
    const saved = await savePreparedArticle({
      source,
      sourceId: matchedSource?.id ?? null,
      topicId: topic.id,
      generatedAt,
      provider: defaults.provider
    });

    savedArticles.push(saved);
  }

  const title = cleanDisplayText(asOptionalString(input.title), {
    maxLength: 180,
    fallback: `${topic.name} source overview`
  });
  const provider = cleanDisplayText(asOptionalString(input.provider) ?? defaults.provider, {
    maxLength: 120,
    fallback: defaults.provider
  });
  const model = cleanDisplayText(asOptionalString(input.model) ?? defaults.model, {
    maxLength: 120,
    fallback: defaults.model
  });
  const freshnessLabel = cleanDisplayText(asOptionalString(input.freshnessLabel), {
    maxLength: 80,
    fallback: "Prepared by Codex"
  });
  const articleIds = savedArticles.map((article) => ({ id: article.id }));
  const uniqueSources = uniqueBy(savedArticles, (article) => article.publisher.toLowerCase());

  const existing = await prisma.newsSummary.findFirst({
    where: { topicId: topic.id },
    orderBy: { generatedAt: "desc" }
  });

  const summaryData = {
    title,
    summary: paragraphs.join("\n\n"),
    generatedAt,
    sourceCount: uniqueSources.length,
    articleCount: savedArticles.length,
    provider,
    model,
    freshnessLabel,
    sources: {
      create: savedArticles.slice(0, 10).map((article) => ({
        title: article.title,
        publisher: article.publisher,
        url: article.sourceUrl,
        publishedAt: article.publishedAt
      }))
    }
  };

  if (existing) {
    await prisma.summarySource.deleteMany({ where: { newsSummaryId: existing.id } });
    await prisma.newsSummary.update({
      where: { id: existing.id },
      data: {
        ...summaryData,
        articles: { set: articleIds }
      }
    });
    return existing.id;
  }

  const created = await prisma.newsSummary.create({
    data: {
      topicId: topic.id,
      ...summaryData,
      articles: { connect: articleIds }
    }
  });

  return created.id;
}

async function resolveTopic(topicSlug: string) {
  if (topicSlug === SOURCE_REGISTRY_TOPIC.slug) {
    return ensureSourceRegistryTopic();
  }

  const existing = await prisma.topic.findUnique({ where: { slug: topicSlug } });
  if (existing) {
    return existing;
  }

  throw new Error(`Topic not found: ${topicSlug}. Use a topic slug from workflow context.`);
}

async function savePreparedArticle(input: {
  source: NormalizedPreparedSource;
  sourceId: string | null;
  topicId: string;
  generatedAt: Date;
  provider: string;
}) {
  const { source, sourceId, topicId, generatedAt, provider } = input;
  const tagLabels = normalizeTags(source.tags, source.category);
  const domain = new URL(source.url).hostname;
  const contentHash = `${slugify(source.title)}-${slugify(source.excerpt)}`.slice(0, 64);

  return prisma.externalArticle.upsert({
    where: { sourceUrl: source.url },
    update: {
      sourceId,
      topicId,
      title: source.title,
      publisher: source.publisher,
      excerpt: source.excerpt,
      publishedAt: source.publishedAt ? new Date(source.publishedAt) : null,
      articleType: source.articleType.toUpperCase() as any,
      category: source.category,
      note: source.excerpt,
      domain,
      analysisStatus: "generated",
      analysisProvider: provider,
      analyzedAt: generatedAt,
      analysisError: null,
      lastSeenAt: generatedAt,
      contentHash,
      isSummaryCandidate: true,
      tags: {
        set: [],
        connectOrCreate: tagLabels.map((label) => ({
          where: { slug: slugify(label) },
          create: { slug: slugify(label), label }
        }))
      }
    },
    create: {
      sourceId,
      topicId,
      sourceUrl: source.url,
      title: source.title,
      publisher: source.publisher,
      excerpt: source.excerpt,
      publishedAt: source.publishedAt ? new Date(source.publishedAt) : null,
      articleType: source.articleType.toUpperCase() as any,
      status: "UNREAD",
      category: source.category,
      note: source.excerpt,
      domain,
      analysisStatus: "generated",
      analysisProvider: provider,
      analyzedAt: generatedAt,
      analysisError: null,
      importedAt: generatedAt,
      lastSeenAt: generatedAt,
      contentHash,
      isSummaryCandidate: true,
      tags: {
        connectOrCreate: tagLabels.map((label) => ({
          where: { slug: slugify(label) },
          create: { slug: slugify(label), label }
        }))
      }
    }
  });
}

interface NormalizedPreparedSource {
  title: string;
  publisher: string;
  url: string;
  publishedAt?: string;
  excerpt: string;
  category: string;
  articleType: "blog" | "news";
  sourceSlug?: string;
  tags: string[];
}

function normalizeSources(value: unknown): NormalizedPreparedSource[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((source): NormalizedPreparedSource | null => {
      const raw = source as PreparedSummarySourceInput;
      const url = normalizeUrl(raw.url);
      if (!url) {
        return null;
      }

      const title = cleanDisplayText(asOptionalString(raw.title), {
        maxLength: 180,
        fallback: startCaseFromUrl(url)
      });
      const publisher = cleanDisplayText(asOptionalString(raw.publisher), {
        maxLength: 120,
        fallback: new URL(url).hostname.replace(/^www\./, "")
      });
      const category = normalizeCategory(asOptionalString(raw.category) ?? inferCategory(`${title} ${publisher}`));
      const articleType = asOptionalString(raw.articleType) === "news" ? "news" : "blog";
      const publishedAt = normalizeDate(raw.publishedAt);

      return {
        title,
        publisher,
        url,
        publishedAt,
        excerpt: cleanDisplayText(asOptionalString(raw.excerpt), {
          maxLength: 360,
          fallback: title
        }),
        category,
        articleType,
        sourceSlug: asOptionalString(raw.sourceSlug),
        tags: normalizeRawTags(raw.tags)
      };
    })
    .filter((source): source is NormalizedPreparedSource => source !== null);
}

function matchSource(source: NormalizedPreparedSource, sourceMatches: ContentSourceMatch[]) {
  if (source.sourceSlug) {
    const bySlug = sourceMatches.find((candidate) => candidate.slug === source.sourceSlug);
    if (bySlug) {
      return bySlug;
    }
  }

  const sourceUrl = new URL(source.url);
  return sourceMatches.find((candidate) => {
    const candidateUrl = new URL(candidate.sourceUrl);
    return candidateUrl.hostname === sourceUrl.hostname;
  });
}

function normalizeParagraphs(value: unknown) {
  const values = Array.isArray(value) ? value : typeof value === "string" ? value.split(/\n\s*\n/g) : [];

  return values
    .map((paragraph) => cleanDisplayText(String(paragraph), { maxLength: 800 }))
    .filter(Boolean)
    .slice(0, 4);
}

function normalizeTags(value: string[], category: string) {
  const tags = value.length ? value : [category];
  return uniqueBy(
    tags
      .map((tag) => cleanDisplayText(tag, { maxLength: 60 }))
      .filter(Boolean),
    (tag) => slugify(tag)
  ).slice(0, 6);
}

function normalizeRawTags(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((tag) => cleanDisplayText(String(tag), { maxLength: 60 }))
    .filter(Boolean)
    .slice(0, 6);
}

function normalizeTopicSlug(value: unknown) {
  const raw = asOptionalString(value);
  return raw ? slugify(raw) : SOURCE_REGISTRY_TOPIC.slug;
}

function normalizeUrl(value: unknown) {
  const raw = asOptionalString(value);
  if (!raw) {
    return null;
  }

  try {
    const url = new URL(raw);
    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function normalizeDate(value: unknown) {
  const raw = asOptionalString(value);
  if (!raw) {
    return undefined;
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function normalizeCategory(value: string) {
  const categories = ["AI", "Architecture", "Web", "Data", "Engineering Practice", "Career"];
  return categories.includes(value) ? value : "Engineering Practice";
}

function inferCategory(value: string) {
  const haystack = value.toLowerCase();
  if (/ai|llm|model|agent|inference|eval/.test(haystack)) return "AI";
  if (/react|frontend|browser|web|server rendering|css/.test(haystack)) return "Web";
  if (/data|lakehouse|spark|streaming|warehouse|pipeline|database|etl/.test(haystack)) return "Data";
  if (/architecture|distributed|scalability|platform|system/.test(haystack)) return "Architecture";
  if (/career|leadership|hiring|manager|mentor/.test(haystack)) return "Career";
  return "Engineering Practice";
}

function startCaseFromUrl(url: string) {
  const pathname = new URL(url).pathname;
  const lastSegment = pathname.split("/").filter(Boolean).at(-1);
  if (!lastSegment) {
    return new URL(url).hostname;
  }

  return lastSegment.replace(/[-_]+/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function asOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
