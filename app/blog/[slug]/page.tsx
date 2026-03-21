import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CommentForm } from "@/components/comment-form";
import { CommentThread } from "@/components/comment-thread";
import { getSessionUser } from "@/lib/auth";
import { getPostBySlugData, getPublicCommentsByPostSlug } from "@/lib/store";
import { formatDate } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlugData(slug);

  if (!post) {
    return {};
  }

  return {
    title: post.title,
    description: post.summary
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlugData(slug);

  if (!post) {
    notFound();
  }

  const [postComments, user] = await Promise.all([getPublicCommentsByPostSlug(post.slug), getSessionUser()]);

  return (
    <section className="article-layout">
      <div className="shell content-shell">
        <article className="article-shell">
          <p className="eyebrow">Article</p>
          <h1>{post.title}</h1>
          <div className="meta-row wrap-row">
            <span>{formatDate(post.publishedAt)}</span>
            <span>{post.readingMinutes} min read</span>
          </div>
          <div className="pill-row">
            {post.tags.map((tag) => (
              <span key={tag} className="pill">
                {tag}
              </span>
            ))}
          </div>
          <div className="article-body">
            {post.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </article>

        <aside className="article-sidebar discussion-stack">
          <div className="card discussion-intro">
            <p className="eyebrow">Discussion</p>
            <h3>Reader comments</h3>
            <p className="card-copy">Read public comments or add your own response if you are signed in.</p>
          </div>
          {user ? (
            <CommentForm postSlug={post.slug} />
          ) : (
            <div className="card sign-in-callout">
              <p className="eyebrow">Sign in required</p>
              <h3>Join the discussion</h3>
              <p className="card-copy">Create a reader account or sign in before posting.</p>
              <Link href="/sign-in" className="button-link is-primary">
                Sign in to comment
              </Link>
            </div>
          )}
          <CommentThread comments={postComments} />
        </aside>
      </div>
    </section>
  );
}
