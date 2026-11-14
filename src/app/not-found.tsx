import Link from "next/link";

export default function NotFound() {
  return (
    <main className="shell section">
      <p className="brand-hero" style={{ fontSize: "3rem" }}>
        tryui
      </p>
      <h1>Brief not found</h1>
      <p className="section-lead">
        That share link may have expired or never existed on this server.
      </p>
      <Link className="btn-primary" href="/">
        Back home
      </Link>
    </main>
  );
}
