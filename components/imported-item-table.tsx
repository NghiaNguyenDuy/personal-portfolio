import { SourceBadge } from "@/components/source-badge";
import { TagPill } from "@/components/tag-pill";
import type { ExternalArticle } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function ImportedItemTable({ items }: { items: ExternalArticle[] }) {
  return (
    <section className="card" style={{ gridColumn: "1 / -1" }}>
      <p className="eyebrow">Imported content</p>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Tags</th>
            <th>Summary</th>
            <th>Imported</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <strong>{item.title}</strong>
                <div className="muted">{item.sourceName ?? item.publisher}</div>
                <div className="muted">{item.note}</div>
              </td>
              <td>
                <div className="filter-row compact-row">
                  {item.tags.map((tag) => (
                    <TagPill key={tag.slug} label={tag.label} />
                  ))}
                </div>
              </td>
              <td>
                <div>{item.category}</div>
                <div className="muted">{item.isSummaryCandidate ? "Included" : "Excluded"}</div>
              </td>
              <td>
                {item.sourceName ? <SourceBadge label={item.sourceName} /> : null}
                <div className="muted">{item.importedAt ? formatDate(item.importedAt) : formatDate(item.publishedAt)}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
