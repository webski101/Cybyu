import Link from "next/link";
import { notFound } from "next/navigation";
import { ResultBrief } from "@/components/ResultBrief";
import { getResult } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getResult(id);
  if (!result) notFound();

  return (
    <main>
      <header className="shell site-header">
        <Link className="brand" href="/">
          tryui
        </Link>
        <p className="nav-note">Shared brief</p>
      </header>

      <section className="shell section">
        <p className="section-kicker">Shared result</p>
        <h2>Offer brief</h2>
        <p className="section-lead">
          Someone checked an offer with tryui and shared this go / no-go brief.
        </p>
        <ResultBrief result={result} />
        <div className="cta-row" style={{ marginTop: "1.5rem" }}>
          <Link className="btn-primary" href="/#check">
            Check another offer
          </Link>
        </div>
      </section>
    </main>
  );
}
