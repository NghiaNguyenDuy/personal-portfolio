import Link from "next/link";
import { PostCard } from "@/components/post-card";
import { SectionHeading } from "@/components/section-heading";
import { SummaryCard } from "@/components/summary-card";
import { siteConfig } from "@/lib/data";
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
        <div className="shell hero-layout">
          <div className="hero-copy">
            <p className="eyebrow">Personal hub</p>
            <h1>{siteConfig.name}</h1>
            <p className="hero-deck">{profile.headline}</p>
            <p>{profile.shortBio} {profile.availability}</p>
            <div className="hero-cta">
              <Link href="/blog" className="button-link is-primary">
                Read writing
              </Link>
              <Link href="/news" className="button-link">
                Open signals
              </Link>
            </div>
          </div>

          <aside className="hero-index" aria-label="Hub index">
            <div className="index-row">
              <span>01</span>
              <strong>Current focus</strong>
              <p>Databricks lakehouse modernization, medallion pipelines, observability, and cost-aware platform operations.</p>
            </div>
            <div className="index-row">
              <span>02</span>
              <strong>Selected systems</strong>
              <p>{profile.projects.length} systems mapped from data platform, analytics, and intelligent document processing work.</p>
            </div>
            <div className="index-row">
              <span>03</span>
              <strong>Latest writing</strong>
              <p>{featuredPosts.length} featured notes from engineering practice and experiments.</p>
            </div>
            <div className="index-row">
              <span>04</span>
              <strong>Signal desk</strong>
              <p>{trackedTopics.length} tracked topics with cached summaries and source citations.</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <SectionHeading
            eyebrow="Selected systems"
            title="Data systems with clear platform boundaries, reliable transformation layers, and operational ownership."
            description={profile.longBio}
          />
          <div className="project-list">
            {profile.projects.map((project) => (
              <article key={project.id} className="project-row">
                <div>
                  <p className="eyebrow">System</p>
                  <h3>{project.title}</h3>
                </div>
                <p>{project.description}</p>
                <div className="pill-row">
                  {project.stack.map((item) => (
                    <span key={item} className="pill">
                      {item}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <SectionHeading
            eyebrow="Latest writing"
            title="Notes that show the thinking behind lakehouse and platform operations."
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
            eyebrow="Signal desk"
            title="Curated summaries for data engineering topics worth tracking."
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
