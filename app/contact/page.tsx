import type { Metadata } from "next";
import { getCareerProfile } from "@/lib/repository";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact information and availability."
};

export default function ContactPage() {
  const profile = getCareerProfile();

  return (
    <section className="contact-layout">
      <div className="shell two-grid">
        <div className="card">
          <p className="eyebrow">Contact</p>
          <h1>Let’s talk about product engineering, platforms, and writing systems.</h1>
        </div>
        <div className="card">
          <p>Email</p>
          <h2>{profile.email}</h2>
          <p className="muted">{profile.location}</p>
          <p>{profile.availability}</p>
        </div>
      </div>
    </section>
  );
}
