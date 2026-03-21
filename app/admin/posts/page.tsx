import { AdminForm } from "@/components/admin-form";
import { savePostAction } from "@/lib/actions";
import { getAdminPostsData } from "@/lib/store";
import { formatDate } from "@/lib/utils";

export default async function AdminPostsPage() {
  const posts = await getAdminPostsData();

  return (
    <div className="admin-grid">
      <AdminForm
        title="Create or update a blog draft"
        description="This form now saves directly to Prisma using the post slug as the upsert key."
        action={savePostAction}
        fields={[
          { name: "title", label: "Title", placeholder: "Designing durable admin workflows" },
          { name: "slug", label: "Slug", placeholder: "designing-durable-admin-workflows" },
          { name: "summary", label: "Summary", as: "textarea", placeholder: "Explain what the article covers." },
          { name: "body", label: "Body", as: "textarea", placeholder: "Write the full article body here." },
          { name: "tags", label: "Tags", placeholder: "architecture, editorial" },
          { name: "categories", label: "Categories", placeholder: "Engineering, Practice" },
          { name: "status", label: "Status", placeholder: "draft or published", defaultValue: "draft" },
          { name: "readingMinutes", label: "Reading minutes", type: "number", defaultValue: 5 }
        ]}
      />

      <div className="card">
        <p className="eyebrow">Saved posts</p>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Date</th>
              <th>Tags</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id}>
                <td>{post.title}</td>
                <td>{post.status}</td>
                <td>{formatDate(post.publishedAt)}</td>
                <td>{post.tags.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}