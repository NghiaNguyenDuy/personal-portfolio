import type { Metadata } from "next";
import { SectionHeading } from "@/components/section-heading";
import { getCareerProfile } from "@/lib/repository";

export const metadata: Metadata = {
  title: "About",
  description: "Career profile, experience, featured skills, and selected engineering projects."
};

export default function AboutPage() {
  const profile = getCareerProfile();

  return (
    <section className="section">
      <div className="shell">
        <SectionHeading eyebrow="Career Profile" title={profile.headline} description={profile.longBio} />

        <div className="content-shell">
          <div className="card">
            <p className="eyebrow">Experience</p>
            <ul className="list-reset">
              {profile.experiences.map((experience) => (
                <li key={experience.id} className="timeline-item">
                  <h3>
                    {experience.role} · {experience.company}
                  </h3>
                  <p className="muted">
                    {experience.start} - {experience.end ?? "Present"}
                  </p>
                  <p>{experience.summary}</p>
                  <ul>
                    {experience.achievements.map((achievement) => (
                      <li key={achievement}>{achievement}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <p className="eyebrow">Selected Projects</p>
            <ul className="list-reset">
              {profile.projects.map((project) => (
                <li key={project.id} className="timeline-item">
                  <h3>{project.title}</h3>
                  <p>{project.summary}</p>
                  <div className="pill-row">
                    {project.stack.map((item) => (
                      <span key={item} className="pill">
                        {item}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
