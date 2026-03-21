import type { ReactNode } from "react";
import Link from "next/link";
import { signOutAction } from "@/lib/actions";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin();

  return (
    <section className="section">
      <div className="shell">
        <div className="card" style={{ marginBottom: 24 }}>
          <p className="eyebrow">Admin</p>
          <h1>Editorial command center</h1>
          <p className="muted">Signed in as {user.email}</p>
          <div className="pill-row" style={{ marginTop: 16 }}>
            <Link href="/admin" className="button-link">
              Overview
            </Link>
            <Link href="/admin/posts" className="button-link">
              Posts
            </Link>
            <Link href="/admin/content" className="button-link">
              Content Flow
            </Link>
            <Link href="/admin/comments" className="button-link">
              Comments
            </Link>
            <form action={signOutAction}>
              <button type="submit">Sign out</button>
            </form>
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}
