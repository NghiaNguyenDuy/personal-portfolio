import { comments, contentSources, posts, readingList, summaries, topics } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { cleanDisplayText } from "@/lib/text-cleanup";
import type { Comment, ContentFilters, ContentSource, ExternalArticle, NewsOverview, NewsOverviewGroup, NewsOverviewSource, NewsSummary, Post, Tag, Topic } from "@/lib/types";
import { byDateDesc, uniqueBy } from "@/lib/utils";

export const NEWS_OVERVIEW_WINDOWS = [3, 5, 7, 14] as const;
const DEFAULT_NEWS_OVERVIEW_WINDOW = 5;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

function splitBody(body: string) {
  return cleanDisplayText(body, { maxLength: 3000 })
    .split(/\n\s*\n/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function byCreatedDesc<T extends { createdAt: string }>(items: T[]) {
  return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function mapTag(tag: { id?: string; slug: string; label: string }): Tag {
  return {
    id: tag.id,
    slug: tag.slug,
    label: cleanDisplayText(tag.label, { maxLength: 80, fallback: tag.slug })
  };
}

function mapPost(post: {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  tags: string[];
  categories: string[];
  status: string;
  publishedAt: Date | null;
  readingMinutes: number | null;
}): Post {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    summary: post.summary,
    body: splitBody(post.body),
    tags: post.tags,
    categories: post.categories,
    status: post.status.toLowerCase() as Post["status"],
    publishedAt: (post.publishedAt ?? new Date()).toISOString(),
    readingMinutes: post.readingMinutes ?? 5
  };
}

function mapComment(comment: {
  id: string;
  body: string;
  status: string;
  createdAt: Date;
  parentId: string | null;
  post: { slug: string };
  author: { name: string | null; email: string };
}): Comment {
  return {
    id: comment.id,
    postSlug: comment.post.slug,
    authorName: comment.author.name ?? comment.author.email,
    status: comment.status.toLowerCase() as Comment["status"],
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    parentId: comment.parentId ?? undefined
  };
}

function mapSource(source: {
  id: string;
  slug: string;
  name: string;
  sourceUrl: string;
  feedUrl: string | null;
  sourceType: string;
  isActive: boolean;
  lastCheckedAt: Date | null;
  lastImportedAt: Date | null;
  lastError: string | null;
  defaultTopic?: { slug: string } | null;
}): ContentSource {
  return {
    id: source.id,
    slug: source.slug,
    name: cleanDisplayText(source.name, { maxLength: 120, fallback: source.slug }),
    sourceUrl: source.sourceUrl,
    feedUrl: source.feedUrl ?? undefined,
    sourceType: source.sourceType.toLowerCase().replace("_", "-") as ContentSource["sourceType"],
    isActive: source.isActive,
    defaultTopicSlug: source.defaultTopic?.slug ?? undefined,
    lastCheckedAt: source.lastCheckedAt?.toISOString(),
    lastImportedAt: source.lastImportedAt?.toISOString(),
    lastError: source.lastError ? cleanDisplayText(source.lastError, { maxLength: 240 }) : undefined
  };
}

function mapReadingItem(item: {
  id: string;
  sourceUrl: string;
  title: string;
  publisher: string;
  excerpt: string | null;
  publishedAt: Date | null;
  articleType: string;
  status: string;
  category: string;
  note: string | null;
  analysisStatus?: string | null;
  analysisProvider?: string | null;
  analyzedAt?: Date | null;
  analysisError?: string | null;
  importedAt?: Date | null;
  lastSeenAt?: Date | null;
  isSummaryCandidate?: boolean;
  topic?: { slug: string } | null;
  source?: { slug: string; name: string } | null;
  sourceSlug?: string;
  sourceName?: string;
  tags?: Array<{ id?: string; slug: string; label: string }>;
}): ExternalArticle {
  return {
    id: item.id,
    sourceUrl: item.sourceUrl,
    title: cleanDisplayText(item.title, { maxLength: 180, fallback: "Untitled source" }),
    publisher: cleanDisplayText(item.publisher, { maxLength: 120, fallback: "Unknown publisher" }),
    excerpt: cleanDisplayText(item.excerpt, { maxLength: 360 }),
    publishedAt: (item.publishedAt ?? new Date()).toISOString(),
    articleType: item.articleType.toLowerCase() as ExternalArticle["articleType"],
    status: item.status.toLowerCase() as ExternalArticle["status"],
    category: cleanDisplayText(item.category, { maxLength: 80, fallback: "Engineering Practice" }),
    note: cleanDisplayText(item.note, { maxLength: 360 }),
    topicSlug: item.topic?.slug ?? undefined,
    sourceSlug: item.source?.slug ?? item.sourceSlug ?? undefined,
    sourceName: cleanDisplayText(item.source?.name ?? item.sourceName, { maxLength: 120 }) || undefined,
    tags: (item.tags ?? []).map(mapTag),
    analysisStatus: (item.analysisStatus?.toLowerCase() as ExternalArticle["analysisStatus"]) ?? undefined,
    analysisProvider: item.analysisProvider ? cleanDisplayText(item.analysisProvider, { maxLength: 120 }) : undefined,
    analyzedAt: item.analyzedAt?.toISOString(),
    analysisError: item.analysisError ? cleanDisplayText(item.analysisError, { maxLength: 240 }) : undefined,
    importedAt: item.importedAt?.toISOString(),
    lastSeenAt: item.lastSeenAt?.toISOString(),
    isSummaryCandidate: item.isSummaryCandidate ?? true
  };
}

function mapTopic(topic: { id: string; slug: string; name: string; description: string; isTracked: boolean }): Topic {
  return {
    id: topic.id,
    slug: topic.slug,
    name: cleanDisplayText(topic.name, { maxLength: 120, fallback: topic.slug }),
    description: cleanDisplayText(topic.description, { maxLength: 360 }),
    isTracked: topic.isTracked
  };
}

function mapSummary(summary: {
  id: string;
  title: string;
  summary: string;
  generatedAt: Date;
  freshnessLabel: string;
  sourceCount: number;
  articleCount?: number;
  provider: string;
  model: string | null;
  topic: { slug: string };
  sources: Array<{ title: string; publisher: string; url: string; publishedAt: Date | null }>;
  articles?: Array<{ source?: { name: string | null } | null; tags: Array<{ id: string; slug: string; label: string }> }>;
}): NewsSummary {
  const derivedTags = uniqueBy(
    (summary.articles ?? []).flatMap((article) => article.tags.map(mapTag)),
    (tag) => tag.slug
  );
  const sourceNames = uniqueBy(
    (summary.articles ?? [])
      .map((article) => article.source?.name)
      .filter((name): name is string => Boolean(name))
      .map((name) => ({ name })),
    (source) => source.name
  ).map((source) => source.name);
  const cleanSourceNames = sourceNames
    .map((sourceName) => cleanDisplayText(sourceName, { maxLength: 120 }))
    .filter(Boolean);

  return {
    id: summary.id,
    topicSlug: summary.topic.slug,
    title: cleanDisplayText(summary.title, { maxLength: 180, fallback: "Source overview" }),
    summary: splitBody(summary.summary),
    generatedAt: summary.generatedAt.toISOString(),
    freshnessLabel: cleanDisplayText(summary.freshnessLabel, { maxLength: 80, fallback: "Generated" }),
    sourceCount: summary.sourceCount,
    articleCount: summary.articleCount ?? summary.sources.length,
    provider: cleanDisplayText(summary.provider, { maxLength: 120, fallback: "Imported sources" }),
    model: cleanDisplayText(summary.model, { maxLength: 120, fallback: "unknown" }),
    sourceNames: cleanSourceNames,
    tags: derivedTags,
    sources: summary.sources.map((source) => ({
      title: cleanDisplayText(source.title, { maxLength: 180, fallback: "Untitled source" }),
      publisher: cleanDisplayText(source.publisher, { maxLength: 120, fallback: "Unknown publisher" }),
      url: source.url,
      publishedAt: (source.publishedAt ?? new Date()).toISOString()
    }))
  };
}

function applyArticleFilters(items: ExternalArticle[], filters: ContentFilters) {
  return byDateDesc(
    items.filter((item) => {
      if (filters.topic && item.topicSlug !== filters.topic) return false;
      if (filters.source && item.sourceSlug !== filters.source) return false;
      if (filters.tag && !item.tags.some((tag) => tag.slug === filters.tag)) return false;
      if (filters.type && item.articleType !== filters.type) return false;
      if (filters.q) {
        const haystack = `${item.title} ${item.excerpt} ${item.note} ${item.publisher}`.toLowerCase();
        if (!haystack.includes(filters.q.toLowerCase())) return false;
      }
      return true;
    })
  );
}

function applySummaryFilters(items: NewsSummary[], filters: ContentFilters) {
  return byDateDesc(
    items.filter((item) => {
      if (filters.topic && item.topicSlug !== filters.topic) return false;
      if (filters.source && !item.sourceNames.some((sourceName) => sourceName.toLowerCase().includes(filters.source!.replace(/-/g, " ")))) return false;
      if (filters.tag && !item.tags.some((tag) => tag.slug === filters.tag)) return false;
      if (filters.q) {
        const haystack = `${item.title} ${item.summary.join(" ")} ${item.sourceNames.join(" ")}`.toLowerCase();
        if (!haystack.includes(filters.q.toLowerCase())) return false;
      }
      return true;
    })
  );
}

function itemTimestamp(item: ExternalArticle) {
  return new Date(item.publishedAt || item.importedAt || item.lastSeenAt || 0).getTime();
}

function groupByCount<T>(
  items: T[],
  keyFn: (item: T) => string | undefined,
  options: {
    hrefFn?: (label: string) => string | undefined;
    dateFn?: (item: T) => string | undefined;
  } = {}
): NewsOverviewGroup[] {
  const groups = new Map<string, { count: number; lastPublishedAt?: string }>();

  for (const item of items) {
    const label = keyFn(item);
    if (!label) continue;

    const existing = groups.get(label) ?? { count: 0, lastPublishedAt: undefined };
    const nextDate = options.dateFn?.(item);
    const latestDate =
      existing.lastPublishedAt && nextDate
        ? new Date(existing.lastPublishedAt).getTime() > new Date(nextDate).getTime()
          ? existing.lastPublishedAt
          : nextDate
        : existing.lastPublishedAt ?? nextDate;

    groups.set(label, {
      count: existing.count + 1,
      lastPublishedAt: latestDate
    });
  }

  return Array.from(groups.entries())
    .map(([label, value]) => ({
      label,
      count: value.count,
      href: options.hrefFn?.(label),
      lastPublishedAt: value.lastPublishedAt
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function buildOverviewSources(items: ExternalArticle[]): NewsOverviewSource[] {
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    publisher: item.publisher,
    url: item.sourceUrl,
    publishedAt: item.publishedAt,
    sourceName: item.sourceName,
    sourceSlug: item.sourceSlug,
    topicSlug: item.topicSlug,
    category: item.category,
    articleType: item.articleType,
    excerpt: item.note || item.excerpt,
    tags: item.tags
  }));
}

function buildOverviewSummary(input: {
  windowDays: number;
  items: ExternalArticle[];
  sourceBreakdown: NewsOverviewGroup[];
  topicBreakdown: NewsOverviewGroup[];
  topTags: NewsOverviewGroup[];
}) {
  const { windowDays, items, sourceBreakdown, topicBreakdown, topTags } = input;

  if (!items.length) {
    return [
      `No imported source items matched the latest ${windowDays}-day overview window.`,
      "Import active sources from the registry or widen the window to build a source-backed overview."
    ];
  }

  const sourceNames = sourceBreakdown.slice(0, 3).map((source) => source.label).join(", ");
  const topicNames = topicBreakdown.slice(0, 3).map((topic) => topic.label).join(", ");
  const tagNames = topTags.slice(0, 4).map((tag) => tag.label).join(", ");
  const topTitles = items.slice(0, 3).map((item) => item.title).join("; ");

  return [
    `The latest ${windowDays}-day source window contains ${items.length} imported item${items.length === 1 ? "" : "s"} from ${sourceBreakdown.length} source${sourceBreakdown.length === 1 ? "" : "s"}${sourceNames ? `, led by ${sourceNames}` : ""}.`,
    topicNames || tagNames
      ? `The strongest themes are ${topicNames || "the filtered source set"}${tagNames ? `, with recurring tags around ${tagNames}` : ""}.`
      : "The current source set is broad enough to review, but it does not yet have enough topic or tag structure for a stronger thematic split.",
    `The source trail starts with ${topTitles}.`
  ];
}

export function normalizeNewsOverviewWindow(value?: string | string[] | number): number {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const numericValue = Number(rawValue);

  return NEWS_OVERVIEW_WINDOWS.includes(numericValue as (typeof NEWS_OVERVIEW_WINDOWS)[number])
    ? numericValue
    : DEFAULT_NEWS_OVERVIEW_WINDOW;
}

export async function getPublishedPostsData(): Promise<Post[]> {
  try {
    const result = await prisma.post.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" }
    });
    if (!result.length) {
      return byDateDesc(posts.filter((post) => post.status === "published"));
    }
    return result.map(mapPost);
  } catch {
    return byDateDesc(posts.filter((post) => post.status === "published"));
  }
}

export async function getFeaturedPostsData(): Promise<Post[]> {
  const result = await getPublishedPostsData();
  return result.slice(0, 2);
}

export async function getPostBySlugData(slug: string): Promise<Post | null> {
  try {
    const result = await prisma.post.findUnique({ where: { slug } });
    if (!result || result.status !== "PUBLISHED") {
      return posts.find((post) => post.slug === slug && post.status === "published") ?? null;
    }
    return mapPost(result);
  } catch {
    return posts.find((post) => post.slug === slug && post.status === "published") ?? null;
  }
}

export async function getPublicCommentsByPostSlug(slug: string): Promise<Comment[]> {
  try {
    const result = await prisma.comment.findMany({
      where: { post: { slug }, status: "APPROVED" },
      include: { post: true, author: true },
      orderBy: { createdAt: "asc" }
    });
    if (!result.length) {
      return comments.filter((comment) => comment.postSlug === slug && comment.status === "approved");
    }
    return result.map(mapComment);
  } catch {
    return comments.filter((comment) => comment.postSlug === slug && comment.status === "approved");
  }
}

export async function getAdminPostsData(): Promise<Post[]> {
  try {
    const result = await prisma.post.findMany({ orderBy: { updatedAt: "desc" } });
    if (!result.length) {
      return byDateDesc(posts);
    }
    return result.map(mapPost);
  } catch {
    return byDateDesc(posts);
  }
}

export async function getImportedArticlesData(filters: ContentFilters = {}): Promise<ExternalArticle[]> {
  try {
    const result = await prisma.externalArticle.findMany({
      where: {
        ...(filters.topic ? { topic: { slug: filters.topic } } : {}),
        ...(filters.source ? { source: { slug: filters.source } } : {}),
        ...(filters.tag ? { tags: { some: { slug: filters.tag } } } : {}),
        ...(filters.type ? { articleType: filters.type.toUpperCase() as any } : {}),
        ...(filters.q
          ? {
              OR: [
                { title: { contains: filters.q, mode: "insensitive" } },
                { excerpt: { contains: filters.q, mode: "insensitive" } },
                { note: { contains: filters.q, mode: "insensitive" } },
                { publisher: { contains: filters.q, mode: "insensitive" } }
              ]
            }
          : {})
      },
      include: { topic: true, source: true, tags: true },
      orderBy: [{ importedAt: "desc" }, { publishedAt: "desc" }]
    });
    if (!result.length) {
      return applyArticleFilters(readingList, filters);
    }
    return result.map(mapReadingItem);
  } catch {
    return applyArticleFilters(readingList, filters);
  }
}

export async function getReadingListData(filters: ContentFilters = {}) {
  return getImportedArticlesData(filters);
}

export async function getNewsOverviewData(filters: ContentFilters = {}, windowDays = DEFAULT_NEWS_OVERVIEW_WINDOW): Promise<NewsOverview> {
  const [items, topics] = await Promise.all([getImportedArticlesData(filters), getTopicsData()]);
  const sortedItems = byDateDesc(items);
  const latestTimestamp = Math.max(...sortedItems.map(itemTimestamp), 0);
  const cutoffTimestamp = latestTimestamp ? latestTimestamp - windowDays * DAY_IN_MS : 0;
  const windowItems = latestTimestamp ? sortedItems.filter((item) => itemTimestamp(item) >= cutoffTimestamp) : [];
  const topicNames = new Map(topics.map((topic) => [topic.slug, topic.name]));
  const sourceBreakdown = groupByCount(windowItems, (item) => item.sourceName ?? item.publisher, {
    hrefFn: (label) => {
      const match = windowItems.find((item) => (item.sourceName ?? item.publisher) === label);
      return match?.sourceSlug ? `/news?source=${match.sourceSlug}` : undefined;
    },
    dateFn: (item) => item.publishedAt
  });
  const topicBreakdown = groupByCount(windowItems, (item) => (item.topicSlug ? topicNames.get(item.topicSlug) ?? item.topicSlug : undefined), {
    hrefFn: (label) => {
      const match = windowItems.find((item) => (item.topicSlug ? topicNames.get(item.topicSlug) ?? item.topicSlug : undefined) === label);
      return match?.topicSlug ? `/news/${match.topicSlug}` : undefined;
    },
    dateFn: (item) => item.publishedAt
  });
  const topTags = groupByCount(
    windowItems.flatMap((item) => item.tags.map((tag) => ({ tag, item }))),
    (entry) => entry.tag.label,
    {
      hrefFn: (label) => {
        const match = windowItems.flatMap((item) => item.tags).find((tag) => tag.label === label);
        return match ? `/news?tag=${match.slug}` : undefined;
      },
      dateFn: (entry) => entry.item.publishedAt
    }
  );

  return {
    windowDays,
    title: `${windowDays}-day source overview`,
    summary: buildOverviewSummary({
      windowDays,
      items: windowItems,
      sourceBreakdown,
      topicBreakdown,
      topTags
    }),
    itemCount: windowItems.length,
    sourceCount: sourceBreakdown.length,
    topicCount: topicBreakdown.length,
    tagCount: topTags.length,
    startedAt: windowItems.length ? new Date(cutoffTimestamp).toISOString() : undefined,
    endedAt: windowItems.length ? new Date(latestTimestamp).toISOString() : undefined,
    sources: buildOverviewSources(windowItems),
    sourceBreakdown,
    topicBreakdown,
    topTags
  };
}

export async function getContentSourcesData(): Promise<ContentSource[]> {
  try {
    const result = await prisma.contentSource.findMany({
      include: { defaultTopic: true },
      orderBy: { updatedAt: "desc" }
    });
    if (!result.length) {
      return contentSources;
    }
    return result.map(mapSource);
  } catch {
    return contentSources;
  }
}

export async function getAvailableTagsData(filters: Omit<ContentFilters, "tag"> = {}): Promise<Tag[]> {
  const items = await getImportedArticlesData(filters);
  return uniqueBy(items.flatMap((item) => item.tags), (tag) => tag.slug).sort((a, b) => a.label.localeCompare(b.label));
}

export async function getAdminCommentsData(): Promise<Comment[]> {
  try {
    const result = await prisma.comment.findMany({
      include: { post: true, author: true },
      orderBy: { createdAt: "desc" }
    });
    if (!result.length) {
      return byCreatedDesc(comments);
    }
    return result.map(mapComment);
  } catch {
    return byCreatedDesc(comments);
  }
}

export async function getTopicsData(): Promise<Topic[]> {
  try {
    const result = await prisma.topic.findMany({ where: { isTracked: true }, orderBy: { name: "asc" } });
    if (!result.length) {
      return topics.filter((topic) => topic.isTracked);
    }
    return result.map(mapTopic);
  } catch {
    return topics.filter((topic) => topic.isTracked);
  }
}

export async function getSummariesData(filters: ContentFilters = {}): Promise<NewsSummary[]> {
  try {
    const result = await prisma.newsSummary.findMany({
      where: {
        ...(filters.topic ? { topic: { slug: filters.topic } } : {}),
        ...(filters.source ? { articles: { some: { source: { slug: filters.source } } } } : {}),
        ...(filters.tag ? { articles: { some: { tags: { some: { slug: filters.tag } } } } } : {}),
        ...(filters.type ? { articles: { some: { articleType: filters.type.toUpperCase() as any } } } : {}),
        ...(filters.q
          ? {
              OR: [
                { title: { contains: filters.q, mode: "insensitive" } },
                { summary: { contains: filters.q, mode: "insensitive" } }
              ]
            }
          : {})
      },
      include: {
        topic: true,
        sources: true,
        articles: {
          include: {
            source: true,
            tags: true
          }
        }
      },
      orderBy: { generatedAt: "desc" }
    });
    if (!result.length) {
      return applySummaryFilters(summaries, filters);
    }
    return result.map(mapSummary);
  } catch {
    return applySummaryFilters(summaries, filters);
  }
}

export async function getSummaryByTopicData(slug: string, filters: Omit<ContentFilters, "topic"> = {}): Promise<NewsSummary | null> {
  try {
    const result = await prisma.newsSummary.findFirst({
      where: {
        topic: { slug },
        ...(filters.source ? { articles: { some: { source: { slug: filters.source } } } } : {}),
        ...(filters.tag ? { articles: { some: { tags: { some: { slug: filters.tag } } } } } : {}),
        ...(filters.type ? { articles: { some: { articleType: filters.type.toUpperCase() as any } } } : {}),
        ...(filters.q
          ? {
              OR: [
                { title: { contains: filters.q, mode: "insensitive" } },
                { summary: { contains: filters.q, mode: "insensitive" } }
              ]
            }
          : {})
      },
      include: {
        topic: true,
        sources: true,
        articles: {
          include: {
            source: true,
            tags: true
          }
        }
      },
      orderBy: { generatedAt: "desc" }
    });
    if (!result) {
      return applySummaryFilters(summaries.filter((summary) => summary.topicSlug === slug), { ...filters, topic: slug })[0] ?? null;
    }
    return mapSummary(result);
  } catch {
    return applySummaryFilters(summaries.filter((summary) => summary.topicSlug === slug), { ...filters, topic: slug })[0] ?? null;
  }
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function createReaderUser(input: { name: string; email: string; passwordHash: string }) {
  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
      role: "READER"
    }
  });
}
