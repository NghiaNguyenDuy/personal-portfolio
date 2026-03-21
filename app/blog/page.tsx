import type { Metadata } from "next";
import { PostCard } from "@/components/post-card";
import { SectionHeading } from "@/components/section-heading";
import { getPublishedPostsData } from "@/lib/store";

export const metadata: Metadata = {
  title: "Blog",
  description: "Engineering articles, practice notes, and experiments."
};

export default async function BlogPage() {
  const allPosts = await getPublishedPostsData();

  return (
    <section className="section">
      <div className="shell">
        <SectionHeading
          eyebrow="Experiment & Practice"
          title="Articles that show how I think, build, and debug."
          description="This area is designed for long-form writing with categories, tags, comments, and future draft scheduling."
        />
        <div className="two-grid">
          {allPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}