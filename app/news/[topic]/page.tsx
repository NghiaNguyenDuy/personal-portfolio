import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentItemCard } from "@/components/content-item-card";
import { NewsFilterBar } from "@/components/news-filter-bar";
import { getAvailableTagsData, getContentSourcesData, getImportedArticlesData, getSummaryByTopicData, getTopicsData } from "@/lib/store";
import type { ContentFilters } from "@/lib/types";
import { formatDate } from "@/lib/utils";

function normalizeFilters(raw: Record<string, string | string[] | undefined>): Omit<ContentFilters, "topic"> {
  const read = (key: string) => {
    const value = raw[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const type = read("type");

  return {
    source: read("source") || undefined,
    tag: read("tag") || undefined,
    type: type === "blog" || type === "news" ? type : undefined,
    q: read("q") || undefined
  };
}

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }): Promise<Metadata> {
  const { topic } = await params;
  const summary = await getSummaryByTopicData(topic);

  if (!summary) {
    return {};
  }

  return {
    title: summary.title,
    description: summary.summary[0]
  };
}

export default async function NewsTopicPage({
  params,
  searchParams
}: {
  params: Promise<{ topic: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { topic } = await params;
  const filters = normalizeFilters(await searchParams);
  const [summary, topics, items, sources, tags] = await Promise.all([
    getSummaryByTopicData(topic, filters),
    getTopicsData(),
    getImportedArticlesData({ topic, ...filters }),
    getContentSourcesData(),
    getAvailableTagsData({ topic, source: filters.source, type: filters.type, q: filters.q })
  ]);
  const topicDefinition = topics.find((entry) => entry.slug === topic);

  if (!summary || !topicDefinition) {
    notFound();
  }

  return (
    <section className="summary-layout">
      <div className="shell content-shell topic-shell">
        <div style={{ gridColumn: "1 / -1" }}>
          <NewsFilterBar basePath={`/news/${topic}`} filters={{ topic, ...filters }} topics={topics} sources={sources} tags={tags} />
        </div>

        <article className="summary-shell">
          <p className="eyebrow">Summary</p>
          <h1>{summary.title}</h1>
          <div className="meta-row wrap-row">
            <span>{topicDefinition.name}</span>
            <span>{formatDate(summary.generatedAt)}</span>
            <span>{summary.freshnessLabel}</span>
            <span>{summary.articleCount} items</span>
          </div>
          <div className="summary-body">
            {summary.summary.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </article>

        <aside className="summary-sidebar">
          <div className="card">
            <p className="eyebrow">Details</p>
            <h3>{summary.sourceCount} sources</h3>
            <p>{summary.provider}</p>
            <p className="muted">{summary.model}</p>
          </div>
          <div className="card">
            <p className="eyebrow">Sources</p>
            <ul className="source-list list-reset">
              {summary.sources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noreferrer">
                    {source.title}
                  </a>
                  <p className="muted">
                    {source.publisher} · {formatDate(source.publishedAt)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div style={{ gridColumn: "1 / -1" }}>
          <div className="section-heading compact-heading">
            <p className="eyebrow">Items</p>
            <h2>{items.length} matching items</h2>
          </div>
          <div className="two-grid">
            {items.map((item) => (
              <ContentItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
