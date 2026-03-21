import type { Comment } from "@/lib/types";
import { formatDate } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function CommentThread({ comments }: { comments: Comment[] }) {
  const roots = comments.filter((comment) => !comment.parentId);

  if (!roots.length) {
    return (
      <div className="card comment-empty-state">
        <p className="eyebrow">Discussion</p>
        <h3>No comments yet</h3>
        <p className="card-copy">Be the first reader to leave a thoughtful response.</p>
      </div>
    );
  }

  return (
    <div className="comment-list">
      {roots.map((comment) => {
        const replies = comments.filter((entry) => entry.parentId === comment.id);

        return (
          <article key={comment.id} className="comment-card">
            <div className="comment-card-head">
              <div className="comment-author-mark" aria-hidden="true">
                {initials(comment.authorName)}
              </div>
              <div className="comment-author-block">
                <strong>{comment.authorName}</strong>
                <div className="meta-row">
                  <span>{formatDate(comment.createdAt)}</span>
                </div>
              </div>
            </div>

            <p className="comment-body">{comment.body}</p>

            {replies.length ? (
              <div className="comment-replies">
                {replies.map((reply) => (
                  <div key={reply.id} className="comment-reply">
                    <div className="comment-card-head">
                      <div className="comment-author-mark is-reply" aria-hidden="true">
                        {initials(reply.authorName)}
                      </div>
                      <div className="comment-author-block">
                        <strong>{reply.authorName}</strong>
                        <div className="meta-row">
                          <span>{formatDate(reply.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <p className="comment-body">{reply.body}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
