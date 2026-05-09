import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { analyzeExternalArticle, normalizeTagLabels, type AnalyzedArticle } from "@/lib/services/article-analysis";
import { cleanDisplayText, decodeHtmlEntities, stripUnsafeHtmlBlocks } from "@/lib/text-cleanup";
import { slugify, uniqueBy } from "@/lib/utils";

interface SourceRecord {
  id: string;
  name: string;
  slug: string;
  sourceUrl: string;
  feedUrl: string | null;
  sourceType: "RSS" | "ATOM" | "BLOG_INDEX" | "MANUAL";
  defaultTopicId: string | null;
  lastImportedAt?: Date | null;
}

interface SourceEntry {
  url: string;
  title: string;
  publishedAt?: string;
  publisher: string;
}

interface ImportOptions {
  fallbackTopicId?: string | null;
}

export interface SourceImportResult {
  sourceId: string;
  sourceName: string;
  ok: boolean;
  importedCount: number;
  checkedCount: number;
  error?: string;
}

export const SOURCE_REGISTRY_TOPIC = {
  slug: "source-registry",
  name: "Source Registry",
  description: "A dynamic overview topic for active source registry imports that do not have a dedicated default topic.",
  articleLimit: 12
} as const;

export async function ensureSourceRegistryTopic() {
  return prisma.topic.upsert({
    where: { slug: SOURCE_REGISTRY_TOPIC.slug },
    update: {
      name: SOURCE_REGISTRY_TOPIC.name,
      description: SOURCE_REGISTRY_TOPIC.description,
      isTracked: true,
      articleLimit: SOURCE_REGISTRY_TOPIC.articleLimit
    },
    create: {
      slug: SOURCE_REGISTRY_TOPIC.slug,
      name: SOURCE_REGISTRY_TOPIC.name,
      description: SOURCE_REGISTRY_TOPIC.description,
      isTracked: true,
      articleLimit: SOURCE_REGISTRY_TOPIC.articleLimit
    }
  });
}

export async function importSourceById(sourceId: string) {
  const source = await prisma.contentSource.findUnique({ where: { id: sourceId } });
  if (!source) {
    throw new Error("Source not found.");
  }

  const fallbackTopicId = source.defaultTopicId ? null : (await ensureSourceRegistryTopic()).id;
  return importSource(source, { fallbackTopicId });
}

export async function importActiveSources(options: ImportOptions = {}) {
  const sources = await prisma.contentSource.findMany({ where: { isActive: true } });
  const results: SourceImportResult[] = [];
  const fallbackTopicId =
    options.fallbackTopicId !== undefined
      ? options.fallbackTopicId
      : sources.some((source) => !source.defaultTopicId)
        ? (await ensureSourceRegistryTopic()).id
        : null;

  for (const source of sources) {
    try {
      results.push(await importSource(source, { fallbackTopicId }));
    } catch (error) {
      results.push({
        sourceId: source.id,
        sourceName: source.name,
        ok: false,
        importedCount: 0,
        checkedCount: 0,
        error: error instanceof Error ? error.message : "Unable to import source."
      });
    }
  }

  return results;
}

export async function importSource(source: SourceRecord, options: ImportOptions = {}): Promise<SourceImportResult> {
  const startedAt = new Date();
  const topicId = source.defaultTopicId ?? options.fallbackTopicId ?? null;

  try {
    const entries = await fetchSourceEntries(source);
    let importedCount = 0;
    let failedEntryCount = 0;
    let lastEntryError: string | null = null;

    for (const entry of entries) {
      try {
        const analysis = await analyzeEntry(entry);
        await saveImportedArticle({ source, topicId, analysis, importedAt: startedAt });

        importedCount += 1;
      } catch (error) {
        failedEntryCount += 1;
        lastEntryError = error instanceof Error ? error.message : "Unable to import article entry.";
        // Keep importing other entries even when a specific article fails.
      }
    }

    const sourceWarning =
      entries.length > 0 && importedCount === 0
        ? `Discovered ${entries.length} entries, but none could be imported. Failed entries: ${failedEntryCount}.${lastEntryError ? ` Last error: ${lastEntryError}` : ""}`
        : null;

    await prisma.contentSource.update({
      where: { id: source.id },
      data: {
        defaultTopicId: source.defaultTopicId ?? options.fallbackTopicId ?? undefined,
        lastCheckedAt: startedAt,
        lastImportedAt: importedCount ? startedAt : source.lastImportedAt ?? null,
        lastError: sourceWarning
      }
    });

    return {
      sourceId: source.id,
      sourceName: source.name,
      ok: sourceWarning === null,
      importedCount,
      checkedCount: entries.length,
      error: sourceWarning ?? undefined
    };
  } catch (error) {
    await prisma.contentSource.update({
      where: { id: source.id },
      data: {
        lastCheckedAt: startedAt,
        lastError: error instanceof Error ? error.message : "Unable to import source."
      }
    });

    throw error;
  }
}

async function analyzeEntry(entry: SourceEntry) {
  try {
    return await analyzeExternalArticle({
      sourceUrl: entry.url,
      overrides: {
        title: entry.title,
        publisher: entry.publisher
      }
    });
  } catch (error) {
    return buildFeedMetadataFallback(entry, error);
  }
}

async function saveImportedArticle(input: {
  source: SourceRecord;
  topicId: string | null;
  analysis: AnalyzedArticle;
  importedAt: Date;
}) {
  const { source, topicId, analysis, importedAt } = input;
  const tags = normalizeTagLabels(analysis.tags);
  const contentHash = createHash("sha256")
    .update(`${analysis.title}:${analysis.excerpt}:${analysis.note}`)
    .digest("hex")
    .slice(0, 24);

  await prisma.externalArticle.upsert({
    where: { sourceUrl: analysis.sourceUrl },
    update: {
      sourceId: source.id,
      topicId,
      title: analysis.title,
      publisher: analysis.publisher,
      excerpt: analysis.excerpt,
      publishedAt: analysis.publishedAt ? new Date(analysis.publishedAt) : null,
      articleType: analysis.articleType.toUpperCase() as any,
      category: analysis.category,
      note: analysis.note,
      domain: analysis.domain,
      analysisStatus: analysis.analysisStatus,
      analysisProvider: analysis.analysisProvider,
      analyzedAt: new Date(analysis.analyzedAt),
      analysisError: analysis.analysisError ?? null,
      lastSeenAt: importedAt,
      contentHash,
      isSummaryCandidate: true,
      tags: {
        set: [],
        connectOrCreate: tags.map((tag) => ({
          where: { slug: tag.slug },
          create: { slug: tag.slug, label: tag.label }
        }))
      }
    },
    create: {
      sourceId: source.id,
      topicId,
      sourceUrl: analysis.sourceUrl,
      title: analysis.title,
      publisher: analysis.publisher,
      excerpt: analysis.excerpt,
      publishedAt: analysis.publishedAt ? new Date(analysis.publishedAt) : null,
      articleType: analysis.articleType.toUpperCase() as any,
      category: analysis.category,
      note: analysis.note,
      domain: analysis.domain,
      analysisStatus: analysis.analysisStatus,
      analysisProvider: analysis.analysisProvider,
      analyzedAt: new Date(analysis.analyzedAt),
      analysisError: analysis.analysisError ?? null,
      importedAt,
      lastSeenAt: importedAt,
      contentHash,
      isSummaryCandidate: true,
      tags: {
        connectOrCreate: tags.map((tag) => ({
          where: { slug: tag.slug },
          create: { slug: tag.slug, label: tag.label }
        }))
      }
    }
  });
}

function buildFeedMetadataFallback(entry: SourceEntry, error: unknown): AnalyzedArticle {
  const sourceUrl = normalizeEntryUrl(entry.url);
  const title = cleanDisplayText(entry.title, { maxLength: 180, fallback: "Untitled source item" });
  const publisher = cleanDisplayText(entry.publisher, { maxLength: 120, fallback: new URL(sourceUrl).hostname });
  const category = inferFallbackCategory(`${title} ${publisher}`);
  const analysisError = error instanceof Error ? error.message : "Unable to fetch article content.";

  return {
    sourceUrl,
    title,
    publisher,
    excerpt: title,
    note: cleanDisplayText(`Imported from ${publisher}. Full article fetch was unavailable; summary uses feed metadata.`, {
      maxLength: 240
    }),
    category,
    tags: inferFallbackTags(`${title} ${publisher}`, category),
    articleType: /\/news\//i.test(sourceUrl) ? "news" : "blog",
    publishedAt: entry.publishedAt,
    domain: new URL(sourceUrl).hostname,
    analysisStatus: "fallback",
    analysisProvider: "feed-metadata-fallback",
    analyzedAt: new Date().toISOString(),
    analysisError
  };
}

function normalizeEntryUrl(value: string) {
  const url = new URL(value);
  url.hash = "";
  return url.toString();
}

function inferFallbackCategory(text: string) {
  const haystack = text.toLowerCase();

  if (/ai|llm|model|agent|inference|evaluation|eval/.test(haystack)) return "AI";
  if (/react|frontend|browser|web|server rendering|css/.test(haystack)) return "Web";
  if (/architecture|distributed|scalability|platform|reliability|system/.test(haystack)) return "Architecture";
  if (/data|lakehouse|spark|streaming|warehouse|pipeline|database|etl/.test(haystack)) return "Data";
  if (/career|leadership|hiring|manager|mentor/.test(haystack)) return "Career";

  return "Engineering Practice";
}

function inferFallbackTags(text: string, category: string) {
  const haystack = text.toLowerCase();
  const tags = new Set<string>([category]);

  if (/databricks|spark|lakehouse|delta/.test(haystack)) tags.add("Databricks");
  if (/stream|kafka|confluent/.test(haystack)) tags.add("Streaming");
  if (/platform|reliability|observability/.test(haystack)) tags.add("Platform Ops");
  if (/ai|llm|model|agent/.test(haystack)) tags.add("AI");
  if (/data|pipeline|warehouse|database/.test(haystack)) tags.add("Data Infra");

  return Array.from(tags).slice(0, 4);
}

async function fetchSourceEntries(source: SourceRecord): Promise<SourceEntry[]> {
  if (source.sourceType === "MANUAL") {
    return [];
  }

  if (source.feedUrl || source.sourceType === "RSS" || source.sourceType === "ATOM") {
    return fetchFeedEntries(source.feedUrl ?? source.sourceUrl, source.sourceUrl, source.name);
  }

  const inferredFeedEntries = await fetchFirstWorkingFeed(source.sourceUrl, source.name);
  if (inferredFeedEntries.length) {
    return inferredFeedEntries;
  }

  const discoveredFeed = await discoverFeedUrl(source.sourceUrl);
  if (discoveredFeed) {
    return fetchFeedEntries(discoveredFeed, source.sourceUrl, source.name);
  }

  return fetchBlogIndexEntries(source.sourceUrl, source.name);
}

async function fetchFeedEntries(feedUrl: string, sourceUrl: string, publisher: string): Promise<SourceEntry[]> {
  const response = await fetch(feedUrl, {
    headers: {
      Accept: "application/rss+xml, application/atom+xml, text/xml, application/xml"
    },
    redirect: "follow"
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch feed (${response.status}).`);
  }

  const xml = await response.text();
  const entries = parseFeedEntries(xml, sourceUrl, publisher);

  if (!entries.length) {
    throw new Error("Feed did not contain any importable entries.");
  }

  return entries.slice(0, 8);
}

async function fetchFirstWorkingFeed(sourceUrl: string, publisher: string) {
  const candidates = inferFeedCandidates(sourceUrl);

  for (const feedUrl of candidates) {
    try {
      return await fetchFeedEntries(feedUrl, sourceUrl, publisher);
    } catch {
      // Try the next conventional feed location before falling back to page discovery.
    }
  }

  return [];
}

function inferFeedCandidates(sourceUrl: string) {
  const url = new URL(sourceUrl);
  const candidates: string[] = [];
  const pathname = url.pathname.replace(/\/+$/, "");
  const pathSegments = pathname.split("/").filter(Boolean);
  const add = (path: string) => {
    candidates.push(new URL(path, url.origin).toString());
  };

  if (url.hostname.endsWith(".medium.com")) {
    add("/feed");
  }

  if (url.hostname === "medium.com" && pathname) {
    add(`/feed${pathname}`);
  }

  if (pathname.includes("/bg-p/") && pathSegments.length) {
    add(`/rss/board?board.id=${encodeURIComponent(pathSegments[pathSegments.length - 1])}`);
  }

  if (pathname) {
    add(`${pathname}/feed`);
    add(`${pathname}/feed/`);
    add(`${pathname}/rss.xml`);
  }

  if (pathSegments.length) {
    add(`/${pathSegments[0]}/feed`);
    add(`/${pathSegments[0]}/feed/`);
    add(`/${pathSegments[0]}/rss.xml`);
  }

  add("/feed");
  add("/feed/");
  add("/rss.xml");
  add("/feed.xml");
  add("/atom.xml");

  return uniqueBy(candidates, (candidate) => candidate).slice(0, 10);
}

async function discoverFeedUrl(sourceUrl: string) {
  const response = await fetch(sourceUrl, {
    headers: {
      Accept: "text/html,application/xhtml+xml"
    },
    redirect: "follow"
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch source page (${response.status}).`);
  }

  const html = await response.text();
  const match = html.match(/<link[^>]+type=["']application\/(rss\+xml|atom\+xml)["'][^>]+href=["']([^"']+)["'][^>]*>/i)
    ?? html.match(/<link[^>]+href=["']([^"']+)["'][^>]+type=["']application\/(rss\+xml|atom\+xml)["'][^>]*>/i);

  const href = match?.[2] ?? match?.[1];
  if (!href) {
    return null;
  }

  return new URL(href, sourceUrl).toString();
}

async function fetchBlogIndexEntries(sourceUrl: string, publisher: string): Promise<SourceEntry[]> {
  const response = await fetch(sourceUrl, {
    headers: {
      Accept: "text/html,application/xhtml+xml"
    },
    redirect: "follow"
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch blog index (${response.status}).`);
  }

  const html = await response.text();
  const base = new URL(sourceUrl);
  const matches = Array.from(stripUnsafeHtmlBlocks(html).matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi));

  const entries = matches
    .map((match): SourceEntry | null => {
      const href = match[1];
      const label = cleanText(match[2], 180);
      if (!href || label.length < 12) {
        return null;
      }

      try {
        const resolved = new URL(href, sourceUrl);
        const sameHost = resolved.hostname === base.hostname;
        const likelyArticle = /blog|news|post|article|engineering|stories/i.test(resolved.pathname);
        const notRoot = resolved.pathname !== base.pathname;

        if (!sameHost || !likelyArticle || !notRoot) {
          return null;
        }

        return {
          url: resolved.toString(),
          title: label,
          publisher
        } satisfies SourceEntry;
      } catch {
        return null;
      }
    })
    .filter((entry): entry is SourceEntry => entry !== null);

  return uniqueBy(entries, (entry) => entry.url).slice(0, 8);
}

function parseFeedEntries(xml: string, sourceUrl: string, publisher: string): SourceEntry[] {
  const blocks = Array.from(xml.matchAll(/<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/gi));

  return blocks
    .map((match): SourceEntry | null => {
      const block = match[2];
      const title = decodeXml(findTag(block, "title") ?? "");
      const link = findTag(block, "link") ?? findAtomLink(block);
      const publishedAt = findTag(block, "pubDate") ?? findTag(block, "published") ?? findTag(block, "updated") ?? undefined;

      if (!title || !link) {
        return null;
      }

      return {
        url: new URL(link, sourceUrl).toString(),
        title: cleanText(title, 180),
        publisher,
        publishedAt: publishedAt ? new Date(publishedAt).toISOString() : undefined
      } satisfies SourceEntry;
    })
    .filter((entry): entry is SourceEntry => entry !== null);
}

function findTag(block: string, tagName: string) {
  const match = block.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match?.[1]?.trim();
}

function findAtomLink(block: string) {
  const match = block.match(/<link[^>]+href=["']([^"']+)["'][^>]*\/?>(?:<\/link>)?/i);
  return match?.[1]?.trim();
}

function decodeXml(value: string) {
  return decodeHtmlEntities(value);
}

function cleanText(value: string, maxLength = 240) {
  return cleanDisplayText(value, { maxLength });
}

export function inferSourceIdentity(input: { name?: string; sourceUrl: string; feedUrl?: string }) {
  const hostname = new URL(input.sourceUrl).hostname.replace(/^www\./, "");
  const baseName = input.name?.trim() || hostname.split(".")[0];
  const slug = slugify(baseName);

  return {
    name: baseName
      .split(/[-\s]+/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" "),
    slug,
    sourceType: input.feedUrl ? "rss" : "blog-index"
  } as const;
}


