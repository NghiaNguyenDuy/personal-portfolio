import type { Metadata } from "next";
import { getCareerProfile } from "@/lib/repository";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact information and current data engineering focus."
};

export default function ContactPage() {
  const profile = getCareerProfile();

  return (
    <section className="contact-layout">
      <div className="shell two-grid">
        <div className="panel">
          <p className="eyebrow">Contact</p>
          <h1>Let's talk about data platforms, lakehouse modernization, and analytics systems.</h1>
        </div>
        <div className="panel contact-panel">
          <p className="eyebrow">Email</p>
          <h2>
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
          </h2>
          <p className="muted">{profile.location}</p>
          <p>{profile.availability}</p>
        </div>
      </div>
    </section>
  );
}
