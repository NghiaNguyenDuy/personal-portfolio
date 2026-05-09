import Link from "next/link";
import { SourceBadge } from "@/components/source-badge";
import { TagPill } from "@/components/tag-pill";
import type { ExternalArticle } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function ContentItemCard({ item }: { item: ExternalArticle }) {
  return (
    <article className="list-card content-item-card">
      <div className="meta-row wrap-row">
        {item.sourceName ? <SourceBadge label={item.sourceName} /> : <span>{item.publisher}</span>}
        <span>{formatDate(item.publishedAt)}</span>
      </div>
      <h3 className="card-title">
        <a href={item.sourceUrl} target="_blank" rel="noreferrer">
          {item.title}
        </a>
      </h3>
      <p className="card-copy">{item.note || item.excerpt}</p>
      <div className="meta-row wrap-row">
        <span>{item.category}</span>
        <span>{item.articleType}</span>
      </div>
      <div className="filter-row compact-row">
        {item.tags.map((tag) => (
          <TagPill key={tag.slug} label={tag.label} href={`/news?tag=${tag.slug}`} />
        ))}
        {item.topicSlug ? (
          <Link href={`/news/${item.topicSlug}`} className="tag-pill">
            Topic
          </Link>
        ) : null}
      </div>
    </article>
  );
}
