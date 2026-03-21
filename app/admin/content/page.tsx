import { AdminForm } from "@/components/admin-form";
import { ContentSourceForm } from "@/components/content-source-form";
import { ContentSourceTable } from "@/components/content-source-table";
import { ImportedItemTable } from "@/components/imported-item-table";
import { NewsFilterBar } from "@/components/news-filter-bar";
import { SummaryBuilderPanel } from "@/components/summary-builder-panel";
import { SummaryCard } from "@/components/summary-card";
import { generateSummaryFromFiltersAction, saveContentSourceAction, saveReadingArticleAction } from "@/lib/actions";
import { READING_CATEGORIES } from "@/lib/content";
import { getAvailableTagsData, getContentSourcesData, getImportedArticlesData, getSummariesData, getTopicsData } from "@/lib/store";
import type { ContentFilters } from "@/lib/types";

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

export default async function AdminContentPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = normalizeFilters(await searchParams);
  const [topics, sources, items, tags, summaries] = await Promise.all([
    getTopicsData(),
    getContentSourcesData(),
    getImportedArticlesData(filters),
    getAvailableTagsData({ topic: filters.topic, source: filters.source, type: filters.type, q: filters.q }),
    getSummariesData(filters)
  ]);

  return (
    <div className="admin-grid">
      <div style={{ gridColumn: "1 / -1" }}>
        <NewsFilterBar basePath="/admin/content" filters={filters} topics={topics} sources={sources} tags={tags} />
      </div>

      <ContentSourceForm topics={topics} action={saveContentSourceAction} />
      <SummaryBuilderPanel topics={topics} sources={sources} tags={tags} filters={filters} action={generateSummaryFromFiltersAction} />

      <div style={{ gridColumn: "1 / -1" }}>
        <ContentSourceTable sources={sources} />
      </div>

      <AdminForm
        title="Import one article manually"
        description="Paste a single URL when you want to enrich one item immediately without registering a full source."
        action={saveReadingArticleAction}
        submitLabel="Analyze and import"
        fields={[
          { name: "sourceUrl", label: "Article URL", type: "url", placeholder: "https://example.com/article", required: true },
          { name: "articleType", label: "Type", placeholder: "blog or news", defaultValue: "blog", required: true },
          { name: "title", label: "Override title", placeholder: "Optional manual title", required: false },
          { name: "publisher", label: "Override publisher", placeholder: "Optional manual publisher", required: false },
          { name: "category", label: "Override category", placeholder: READING_CATEGORIES.join(", "), required: false },
          { name: "note", label: "Override note", as: "textarea", placeholder: "Optional private note override", required: false }
        ]}
      />

      <section className="card admin-panel">
        <div className="section-heading">
          <p className="eyebrow">Summary preview</p>
          <h2>{summaries.length} summaries match current filters</h2>
          <p className="section-description">Use the same filters on the public Signals page to inspect the output experience.</p>
        </div>
        <div className="two-grid">
          {summaries.map((summary) => (
            <SummaryCard key={summary.id} summary={summary} />
          ))}
        </div>
      </section>

      <ImportedItemTable items={items} />
    </div>
  );
}
