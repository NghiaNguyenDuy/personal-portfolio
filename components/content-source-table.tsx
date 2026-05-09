import { runSourceImportAction, toggleSourceStatusAction } from "@/lib/actions";
import type { ContentSource } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function ContentSourceTable({ sources }: { sources: ContentSource[] }) {
  return (
    <section className="card">
      <p className="eyebrow">Source registry</p>
      <p className="section-description">Active sources feed the public Signals overview windows before individual items are reviewed in detail.</p>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Source</th>
            <th>Type</th>
            <th>Status</th>
            <th>Last import</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sources.map((source) => (
            <tr key={source.id}>
              <td>
                <strong>{source.name}</strong>
                <div className="muted">{source.sourceUrl}</div>
                {source.lastError ? <div className="form-error">{source.lastError}</div> : null}
              </td>
              <td>{source.sourceType}</td>
              <td>{source.isActive ? "active" : "paused"}</td>
              <td>{source.lastImportedAt ? formatDate(source.lastImportedAt) : "Not imported yet"}</td>
              <td>
                <div className="stack-actions">
                  <form action={runSourceImportAction}>
                    <input type="hidden" name="sourceId" value={source.id} />
                    <button type="submit">Import now</button>
                  </form>
                  <form action={toggleSourceStatusAction}>
                    <input type="hidden" name="sourceId" value={source.id} />
                    <button type="submit">{source.isActive ? "Pause" : "Resume"}</button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
