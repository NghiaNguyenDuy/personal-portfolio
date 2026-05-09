import Link from "next/link";
import { siteConfig } from "@/lib/data";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-shell">
        <div>
          <p className="eyebrow">Personal hub</p>
          <h2>{siteConfig.name}</h2>
          <p className="muted">
            Data engineering writing, selected systems, curated reading, and source-backed signals in one place.
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
