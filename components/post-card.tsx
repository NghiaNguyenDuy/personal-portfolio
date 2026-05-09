import Link from "next/link";
import type { Post } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="list-card post-card">
      <div className="meta-row wrap-row">
        <span>{formatDate(post.publishedAt)}</span>
        <span>{post.readingMinutes} min read</span>
      </div>
      <h3 className="card-title">
        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
      </h3>
      <p className="card-copy">{post.summary}</p>
      <div className="pill-row">
        {post.tags.map((tag) => (
          <span key={tag} className="pill">
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}
