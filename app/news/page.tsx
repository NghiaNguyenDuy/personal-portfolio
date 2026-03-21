import type { Metadata } from "next";
import { ContentItemCard } from "@/components/content-item-card";
import { NewsFilterBar } from "@/components/news-filter-bar";
import { SectionHeading } from "@/components/section-heading";
import { SummaryCard } from "@/components/summary-card";
import { getAvailableTagsData, getContentSourcesData, getImportedArticlesData, getSummariesData, getTopicsData } from "@/lib/store";
import type { ContentFilters } from "@/lib/types";

export const metadata: Metadata = {
  title: "Signals",
  description: "Simple summaries and saved articles from your tracked sources."
};

function normalizeFilters(raw: Record<string, string | string[] | undefined>): ContentFilters {
  const read = (key: string) => {
    const value = raw[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const type = read("type");
  return {
    topic: read("topic") || undefined,
    source: read("source") || undefined,
    tag: read("tag") || undefined,
    type: type === "blog" || type === "news" ? type : undefined,
    q: read("q") || undefined
  };
}

export default async function NewsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = normalizeFilters(await searchParams);
  const [topics, summaries, items, sources, tags] = await Promise.all([
    getTopicsData(),
    getSummariesData(filters),
    getImportedArticlesData(filters),
    getContentSourcesData(),
    getAvailableTagsData({ topic: filters.topic, source: filters.source, type: filters.type, q: filters.q })
  ]);

  return (
    <section className="section">
      <div className="shell">
        <SectionHeading
          eyebrow="Signals"
          title="Saved signals from your sources."
          description="Read short summaries, search items, and filter by topic, source, type, or tag."
        />

        <NewsFilterBar filters={filters} topics={topics} sources={sources} tags={tags} />

        <section className="section-block">
          <div className="section-heading compact-heading">
            <p className="eyebrow">Summaries</p>
            <h2>{summaries.length} summaries</h2>
          </div>
          <div className="two-grid">
            {summaries.map((summary) => (
              <SummaryCard key={summary.id} summary={summary} />
            ))}
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading compact-heading">
            <p className="eyebrow">Items</p>
            <h2>{items.length} items</h2>
          </div>
          <div className="two-grid">
            {items.map((item) => (
              <ContentItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
