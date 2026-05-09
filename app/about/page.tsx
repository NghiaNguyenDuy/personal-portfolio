import type { Metadata } from "next";
import { SectionHeading } from "@/components/section-heading";
import { getCareerProfile } from "@/lib/repository";

export const metadata: Metadata = {
  title: "About",
  description: "Data engineering profile, working stack, experience, publications, and selected systems."
};

export default function AboutPage() {
  const profile = getCareerProfile();

  return (
    <section className="section">
      <div className="shell">
        <SectionHeading
          eyebrow="About"
          title="A working profile for data platform engineering and technical memory."
          description={profile.longBio}
        />

        <div className="skill-strip" aria-label="Featured skills">
          {profile.featuredSkills.map((skill) => (
            <span key={skill} className="pill">
              {skill}
            </span>
          ))}
        </div>

        <div className="content-shell">
          <section className="panel">
            <p className="eyebrow">Experience</p>
            <ul className="list-reset">
              {profile.experiences.map((experience) => (
                <li key={experience.id} className="timeline-item">
                  <h3>
                    {experience.role} / {experience.company}
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
          </section>

          <section className="panel">
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
          </section>
        </div>

        <div className="content-shell profile-evidence">
          {profile.education?.length ? (
            <section className="panel">
              <p className="eyebrow">Education</p>
              <ul className="list-reset">
                {profile.education.map((item) => (
                  <li key={item.id} className="timeline-item">
                    <h3>{item.degree}</h3>
                    <p className="muted">
                      {item.institution} / {item.start} - {item.end ?? "Present"}
                    </p>
                    <p>{item.summary}</p>
                    {item.details?.length ? (
                      <ul>
                        {item.details.map((detail) => (
                          <li key={detail}>{detail}</li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {profile.publications?.length ? (
            <section className="panel">
              <p className="eyebrow">Publications</p>
              <ul className="list-reset">
                {profile.publications.map((publication) => (
                  <li key={publication.id} className="timeline-item">
                    <h3>{publication.title}</h3>
                    <p className="muted">
                      {publication.venue} / {publication.year}
                    </p>
                    {publication.note ? <p>{publication.note}</p> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        {profile.honors?.length ? (
          <section className="panel honors-panel">
            <p className="eyebrow">Honors</p>
            <ul>
              {profile.honors.map((honor) => (
                <li key={honor}>{honor}</li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </section>
  );
}
