import Link from "next/link";
import { PostCard } from "@/components/post-card";
import { SectionHeading } from "@/components/section-heading";
import { SummaryCard } from "@/components/summary-card";
import { getCareerProfile } from "@/lib/repository";
import { getFeaturedPostsData, getSummariesData, getTopicsData } from "@/lib/store";

export default async function HomePage() {
  const profile = getCareerProfile();
  const [featuredPosts, latestSummaries, trackedTopics] = await Promise.all([
    getFeaturedPostsData(),
    getSummariesData().then((items) => items.slice(0, 2)),
    getTopicsData()
  ]);

  return (
    <>
      <section className="hero">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Career + Writing + Signals</p>
            <h1>Build a portfolio that reads like a thoughtful product, not a brochure.</h1>
            <p>
              {profile.shortBio} This platform combines your career profile, original writing, curated reading, and
              daily topic summaries in a single editorial experience.
            </p>
            <div className="hero-cta">
              <Link href="/about" className="button-link is-primary">
                Explore profile
              </Link>
              <Link href="/blog" className="button-link">
                Read articles
              </Link>
            </div>
          </div>

          <aside className="hero-aside">
            <div className="stat-card card">
              <p className="eyebrow">Tracked topics</p>
              <h3>{trackedTopics.length}</h3>
              <p>Daily summaries with cached source citations and transparent freshness labels.</p>
            </div>
            <div className="stat-card card">
              <p className="eyebrow">Publishing model</p>
              <h3>{featuredPosts.length} featured posts</h3>
              <p>Database-backed content design with room for drafts, moderation, and admin workflows.</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <SectionHeading eyebrow="About" title={profile.headline} description={profile.longBio} />
          <div className="pill-row">
            {profile.featuredSkills.map((skill) => (
              <span key={skill} className="pill">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <SectionHeading
            eyebrow="Featured Writing"
            title="Experiment logs, architecture notes, and practical engineering essays."
          />
          <div className="two-grid">
            {featuredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <SectionHeading
            eyebrow="Daily Summaries"
            title="Curated news summaries for topics worth tracking every day."
          />
          <div className="two-grid">
            {latestSummaries.map((summary) => (
              <SummaryCard key={summary.id} summary={summary} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}