import type { Metadata } from "next";
import { NewsFilterBar } from "@/components/news-filter-bar";
import { NewsOverviewPanel } from "@/components/news-overview-panel";
import { SectionHeading } from "@/components/section-heading";
import { SummaryCard } from "@/components/summary-card";
import {
  getAvailableTagsData,
  getContentSourcesData,
  getNewsOverviewData,
  getSummariesData,
  getTopicsData,
  NEWS_OVERVIEW_WINDOWS,
  normalizeNewsOverviewWindow
} from "@/lib/store";
import type { ContentFilters } from "@/lib/types";

export const metadata: Metadata = {
  title: "Signals",
  description: "A windowed overview of source-backed technical signals."
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
  const rawSearchParams = await searchParams;
  const filters = normalizeFilters(rawSearchParams);
  const windowDays = normalizeNewsOverviewWindow(rawSearchParams.window);
  const [topics, summaries, overview, sources, tags] = await Promise.all([
    getTopicsData(),
    getSummariesData(filters),
    getNewsOverviewData(filters, windowDays),
    getContentSourcesData(),
    getAvailableTagsData({ topic: filters.topic, source: filters.source, type: filters.type, q: filters.q })
  ]);

  return (
    <section className="section">
      <div className="shell">
        <SectionHeading
          eyebrow="Signals"
          title="One overview from the source registry."
          description="A rolling digest of imported blogs and articles, with source citations kept close enough to audit the signal."
        />

        <NewsFilterBar filters={filters} topics={topics} sources={sources} tags={tags} />
        <NewsOverviewPanel overview={overview} filters={filters} windowOptions={NEWS_OVERVIEW_WINDOWS} />

        <section className="section-block">
          <div className="section-heading compact-heading">
            <p className="eyebrow">Topic summaries</p>
            <h2>{summaries.length} focused lanes</h2>
          </div>
          <div className="two-grid">
            {summaries.map((summary) => (
              <SummaryCard key={summary.id} summary={summary} />
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
