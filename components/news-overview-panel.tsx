import Link from "next/link";
import type { ContentFilters, NewsOverview } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface NewsOverviewPanelProps {
  overview: NewsOverview;
  filters: ContentFilters;
  windowOptions: readonly number[];
}

function buildWindowHref(filters: ContentFilters, days: number) {
  const params = new URLSearchParams();

  params.set("window", String(days));
  if (filters.topic) params.set("topic", filters.topic);
  if (filters.source) params.set("source", filters.source);
  if (filters.tag) params.set("tag", filters.tag);
  if (filters.type) params.set("type", filters.type);
  if (filters.q) params.set("q", filters.q);

  return `/news?${params.toString()}`;
}

export function NewsOverviewPanel({ overview, filters, windowOptions }: NewsOverviewPanelProps) {
  return (
    <section className="overview-panel">
      <div className="overview-head">
        <div>
          <p className="eyebrow">Window overview</p>
          <h2>{overview.title}</h2>
          <p className="section-description">
            {overview.startedAt && overview.endedAt
              ? `${formatDate(overview.startedAt)} to ${formatDate(overview.endedAt)}`
              : "No source window available yet"}
          </p>
        </div>
        <nav className="window-switcher" aria-label="Summary window">
          {windowOptions.map((days) => (
            <Link key={days} href={buildWindowHref(filters, days)} className={`tag-pill${overview.windowDays === days ? " is-active" : ""}`}>
              {days}d
            </Link>
          ))}
        </nav>
      </div>

      <div className="overview-layout">
        <article className="summary-shell overview-summary">
          <div className="meta-row wrap-row">
            <span>{overview.itemCount} items</span>
            <span>{overview.sourceCount} sources</span>
            <span>{overview.topicCount} topics</span>
            <span>{overview.tagCount} tags</span>
          </div>
          <div className="summary-body">
            {overview.summary.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </article>

        <aside className="overview-rail">
          <div className="overview-stat">
            <p className="eyebrow">Sources</p>
            <ul className="source-list list-reset">
              {overview.sourceBreakdown.slice(0, 5).map((source) => (
                <li key={source.label}>
                  {source.href ? <Link href={source.href}>{source.label}</Link> : <span>{source.label}</span>}
                  <p className="muted">
                    {source.count} item{source.count === 1 ? "" : "s"}
                    {source.lastPublishedAt ? ` / ${formatDate(source.lastPublishedAt)}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <div className="overview-stat">
            <p className="eyebrow">Themes</p>
            <div className="filter-row compact-row">
              {overview.topTags.slice(0, 8).map((tag) =>
                tag.href ? (
                  <Link key={tag.label} href={tag.href} className="tag-pill">
                    {tag.label}
                  </Link>
                ) : (
                  <span key={tag.label} className="tag-pill">
                    {tag.label}
                  </span>
                )
              )}
            </div>
          </div>
        </aside>
      </div>

      <div className="overview-sources">
        <div className="section-heading compact-heading">
          <p className="eyebrow">Source trail</p>
          <h3>{overview.sources.length} blogs and articles in this window</h3>
        </div>
        <ul className="overview-source-list list-reset">
          {overview.sources.slice(0, 12).map((source) => (
            <li key={source.id}>
              <div>
                <a href={source.url} target="_blank" rel="noreferrer">
                  {source.title}
                </a>
                <p className="muted">
                  {source.sourceName ?? source.publisher} / {formatDate(source.publishedAt)} / {source.articleType}
                </p>
              </div>
              <p>{source.excerpt}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
