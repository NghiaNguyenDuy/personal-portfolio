import Link from "next/link";
import { SourceBadge } from "@/components/source-badge";
import { TagPill } from "@/components/tag-pill";
import type { NewsSummary } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function SummaryCard({ summary }: { summary: NewsSummary }) {
  return (
    <article className="card summary-card">
      <div className="meta-row wrap-row">
        <span>{summary.freshnessLabel}</span>
        <span>{formatDate(summary.generatedAt)}</span>
      </div>
      <h3 className="card-title">
        <Link href={`/news/${summary.topicSlug}`}>{summary.title}</Link>
      </h3>
      <p className="card-copy">{summary.summary[0]}</p>
      <div className="meta-row wrap-row">
        <span>{summary.articleCount} items</span>
        <span>{summary.sourceCount} sources</span>
        <span>{summary.provider}</span>
      </div>
      <div className="filter-row compact-row">
        {summary.sourceNames.slice(0, 2).map((sourceName) => (
          <SourceBadge key={sourceName} label={sourceName} />
        ))}
      </div>
      <div className="filter-row compact-row">
        {summary.tags.map((tag) => (
          <TagPill key={tag.slug} label={tag.label} href={`/news?tag=${tag.slug}`} />
        ))}
      </div>
    </article>
  );
}
