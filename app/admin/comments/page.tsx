import { CommentModerationControls } from "@/components/comment-moderation-controls";
import { getAdminCommentsData } from "@/lib/store";
import { formatDate } from "@/lib/utils";

export default async function AdminCommentsPage() {
  const comments = await getAdminCommentsData();

  return (
    <div className="admin-grid">
      <div className="card" style={{ gridColumn: "1 / -1" }}>
        <p className="eyebrow">Moderation queue</p>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Author</th>
              <th>Comment</th>
              <th>Created</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {comments.map((comment) => (
              <tr key={comment.id}>
                <td>{comment.authorName}</td>
                <td>{comment.body}</td>
                <td>{formatDate(comment.createdAt)}</td>
                <td>{comment.status}</td>
                <td>
                  <CommentModerationControls commentId={comment.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}