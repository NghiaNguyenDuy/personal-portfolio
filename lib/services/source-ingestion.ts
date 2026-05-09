import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { analyzeExternalArticle, normalizeTagLabels } from "@/lib/services/article-analysis";
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
}

interface SourceEntry {
  url: string;
  title: string;
  publishedAt?: string;
  publisher: string;
}

export interface SourceImportResult {
  sourceId: string;
  sourceName: string;
  importedCount: number;
  checkedCount: number;
}

export async function importSourceById(sourceId: string) {
  const source = await prisma.contentSource.findUnique({ where: { id: sourceId } });
  if (!source) {
    throw new Error("Source not found.");
  }

  return importSource(source);
}

export async function importActiveSources() {
  const sources = await prisma.contentSource.findMany({ where: { isActive: true } });
  const results: SourceImportResult[] = [];

  for (const source of sources) {
    results.push(await importSource(source));
  }

  return results;
}

export async function importSource(source: SourceRecord): Promise<SourceImportResult> {
  const startedAt = new Date();

  try {
    const entries = await fetchSourceEntries(source);
    let importedCount = 0;

    for (const entry of entries) {
      try {
        const analysis = await analyzeExternalArticle({
          sourceUrl: entry.url,
          overrides: {
            title: entry.title,
            publisher: entry.publisher
          }
        });

        const tags = normalizeTagLabels(analysis.tags);
        const contentHash = createHash("sha256")
          .update(`${analysis.title}:${analysis.excerpt}:${analysis.note}`)
          .digest("hex")
          .slice(0, 24);

        await prisma.externalArticle.upsert({
          where: { sourceUrl: analysis.sourceUrl },
          update: {
            sourceId: source.id,
            topicId: source.defaultTopicId,
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
            lastSeenAt: startedAt,
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
            topicId: source.defaultTopicId,
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
            importedAt: startedAt,
            lastSeenAt: startedAt,
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

        importedCount += 1;
      } catch {
        // Keep importing other entries even when a specific article fails.
      }
    }

    await prisma.contentSource.update({
      where: { id: source.id },
      data: {
        lastCheckedAt: startedAt,
        lastImportedAt: importedCount ? startedAt : source.defaultTopicId ? startedAt : startedAt,
        lastError: null
      }
    });

    return {
      sourceId: source.id,
      sourceName: source.name,
      importedCount,
      checkedCount: entries.length
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

async function fetchSourceEntries(source: SourceRecord): Promise<SourceEntry[]> {
  if (source.sourceType === "MANUAL") {
    return [];
  }

  if (source.feedUrl || source.sourceType === "RSS" || source.sourceType === "ATOM") {
    return fetchFeedEntries(source.feedUrl ?? source.sourceUrl, source.sourceUrl, source.name);
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


