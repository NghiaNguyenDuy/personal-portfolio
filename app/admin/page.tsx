import { getAdminCommentsData, getAdminPostsData, getContentSourcesData, getImportedArticlesData, getSummariesData, getTopicsData } from "@/lib/store";

export default async function AdminPage() {
  const [posts, comments, summaries, imported, topics, sources] = await Promise.all([
    getAdminPostsData(),
    getAdminCommentsData(),
    getSummariesData(),
    getImportedArticlesData(),
    getTopicsData(),
    getContentSourcesData()
  ]);

  return (
    <div className="admin-grid">
      <div className="card">
        <p className="eyebrow">Publishing</p>
        <h2>{posts.length} posts</h2>
        <p>Draft, publish, and revise long-form writing through Prisma-backed admin actions.</p>
      </div>
      <div className="card">
        <p className="eyebrow">Discussion</p>
        <h2>{comments.length} comments</h2>
        <p>Reader comments are moderated through status updates in the admin dashboard.</p>
      </div>
      <div className="card">
        <p className="eyebrow">Topics</p>
        <h2>{topics.length} tracked topics</h2>
        <p>Summaries are now generated from imported items tied to tracked topics.</p>
      </div>
      <div className="card">
        <p className="eyebrow">Sources</p>
        <h2>{sources.length} registered sources</h2>
        <p>Custom blog and feed URLs now drive the ingestion pipeline instead of a live News API search.</p>
      </div>
      <div className="card">
        <p className="eyebrow">Imported content</p>
        <h2>{imported.length} stored items</h2>
        <p>Imported blogs and news live in the same content workspace with tags, notes, and summary eligibility.</p>
      </div>
      <div className="card">
        <p className="eyebrow">Summary cache</p>
        <h2>{summaries.length} generated summaries</h2>
        <p>Public topic pages display summaries built from stored imported sources and traceable tags.</p>
      </div>
    </div>
  );
}
