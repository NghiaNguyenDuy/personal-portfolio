import Link from "next/link";
import { siteConfig } from "@/lib/data";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-shell">
        <div>
          <p className="eyebrow">Portfolio Platform</p>
          <h2>{siteConfig.name}</h2>
          <p className="muted">
            Career story, engineering writing, curated reading, and AI-assisted news summaries in one place.
          </p>
        </div>

        <div className="footer-links">
          {siteConfig.nav.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
