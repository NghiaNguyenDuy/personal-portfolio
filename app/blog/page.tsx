import type { Metadata } from "next";
import { PostCard } from "@/components/post-card";
import { SectionHeading } from "@/components/section-heading";
import { getPublishedPostsData } from "@/lib/store";

export const metadata: Metadata = {
  title: "Writing",
  description: "Data engineering notes, platform operations logs, and applied analytics reflections."
};

export default async function BlogPage() {
  const allPosts = await getPublishedPostsData();

  return (
    <section className="section">
      <div className="shell">
        <SectionHeading
          eyebrow="Writing"
          title="Data engineering notes with enough context to be useful later."
          description="Long-form notes on lakehouse migration, pipeline reliability, observability, cost control, and applied analytics systems."
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
