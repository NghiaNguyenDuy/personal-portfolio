import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section">
      <div className="shell two-grid">
        <div className="card">
          <p className="eyebrow">Not found</p>
          <h1>This page does not exist.</h1>
          <p>The content may have moved, or the route has not been published yet.</p>
          <Link href="/" className="button-link is-primary">
            Go home
          </Link>
        </div>
      </div>
    </section>
  );
}
