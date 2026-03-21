import Link from "next/link";
import { siteConfig } from "@/lib/data";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell nav-shell">
        <Link href="/" className="brand">
          <span className="brand-mark">N</span>
          <span>
            <strong>{siteConfig.name}</strong>
            <small>{siteConfig.title}</small>
          </span>
        </Link>

        <nav className="site-nav" aria-label="Primary">
          {siteConfig.nav.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
          <Link href="/admin" className="nav-admin">
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
