import { Checker } from "@/components/Checker";

export default function HomePage() {
  return (
    <main>
      <header className="shell site-header">
        <a className="brand" href="/">
          tryui
        </a>
        <p className="nav-note">HackGlobal 2026 · Civic / real-world impact</p>
      </header>

      <section className="shell hero">
        <p className="brand-hero">tryui</p>
        <h1>Paste the offer. Get a go / no-go brief.</h1>
        <p className="hero-lead">
          Built for students hit with fake jobs, scholarships, and internship
          pitches. Share the result back into the chat before anyone pays.
        </p>
        <div className="cta-row">
          <a className="btn-primary" href="#check">
            Check an offer
          </a>
          <a className="btn-secondary" href="#how">
            How it works
          </a>
        </div>
        <div className="hero-visual" aria-hidden="true" />
      </section>

      <section className="shell section" id="how">
        <p className="section-kicker">One job</p>
        <h2>A decision product, not another chatbot.</h2>
        <p className="section-lead">
          tryui scores the message against known scam patterns, cites public
          guidance, and gives you questions to ask plus a shareable brief.
        </p>
      </section>

      <section className="shell section" id="check">
        <p className="section-kicker">Try it</p>
        <h2>Check a message now</h2>
        <p className="section-lead">
          No account. Paste text from WhatsApp, email, or SMS. Use a sample if
          you want to see a full brief first.
        </p>
        <Checker />
      </section>

      <footer className="shell site-footer">
        <p>
          tryui runs on Vultr Compute for HackGlobal. Every participant credit
          goes toward keeping demos live.
        </p>
      </footer>
    </main>
  );
}
