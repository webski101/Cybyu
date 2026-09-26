import Link from "next/link";
import { notFound } from "next/navigation";
import { readProofRecord } from "@/lib/storage";
import { buildVercelDemoRecord, parseDemoProofId } from "@/lib/vercel-demo";

type Params = { id: string };
type SearchParams = { reverified?: string };

function formatMs(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "n/a";
  if (value < 1000) return `${value.toFixed(0)} ms`;
  return `${(value / 1000).toFixed(2)} s`;
}

function formatTimestamp(value: string | null): string {
  if (!value) return "n/a";
  return new Date(value).toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

function toneClass(tone: "good" | "bad" | "muted"): string {
  if (tone === "good") return "text-good";
  if (tone === "bad") return "text-bad";
  return "text-slate-400";
}

function Stat({
  label,
  value,
  tone = "muted",
  large = false
}: {
  label: string;
  value: string;
  tone?: "good" | "bad" | "muted";
  large?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-ink-700 bg-ink-800 p-5">
      <p className="text-xs uppercase tracking-wider text-slate-400">{label}</p>
      <p
        className={`mt-2 font-mono ${large ? "text-2xl" : "text-xl"} font-semibold ${toneClass(tone)}`}
      >
        {value}
      </p>
    </div>
  );
}

export default async function ProofPage({
  params,
  searchParams
}: {
  params: Params;
  searchParams?: SearchParams;
}) {
  let record = await readProofRecord(params.id);

  if (!record && process.env.VERCEL) {
    const workloadId = parseDemoProofId(params.id);
    if (workloadId) {
      try {
        record = await buildVercelDemoRecord(
          workloadId,
          searchParams?.reverified === "1" ? 2 : 1
        );
      } catch {
        record = null;
      }
    }
  }

  if (!record) notFound();

  const verifierOk = record.proofStatus === "VALID";
  const artifactName = record.proofArtifactReference
    ? record.proofArtifactReference.split(/[\\/]/).pop() ?? null
    : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <Link
          href="/prove"
          className="font-mono text-xs uppercase tracking-[0.2em] text-accent-500 hover:text-accent-600"
        >
          &larr; Run Verified
        </Link>
        <h1 className="text-3xl font-semibold">Cybyu Execution Proof</h1>
        <p className="text-sm text-slate-400">
          Proof id <span className="font-mono">{record.id}</span>
        </p>
      </header>

      <section className="rounded-2xl border border-ink-700 bg-ink-800 p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Workload
        </h2>
        <p className="text-base font-semibold text-slate-100">{record.workloadTitle}</p>
        <p className="font-mono text-xs uppercase tracking-wider text-slate-500">
          Workload id: {record.workloadId}
        </p>
      </section>

      <section className="rounded-2xl border border-ink-700 bg-ink-800 p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Execution Evidence
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-ink-700 bg-ink-900/60 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-400">ZisK Program Hash</p>
            <p className="mt-2 break-all font-mono text-xs text-accent-500">{record.programHash}</p>
          </div>
          <div className="rounded-xl border border-ink-700 bg-ink-900/60 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-400">Input Hash</p>
            <p className="mt-2 break-all font-mono text-xs text-accent-500">{record.inputHash}</p>
          </div>
          <div className="rounded-xl border border-ink-700 bg-ink-900/60 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-400">Output Hash</p>
            <p className="mt-2 break-all font-mono text-xs text-accent-500">{record.outputHash}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Proof Artifact" value={artifactName ?? "n/a"} />
          <Stat label="Verifications" value={String(record.verifications.length)} />
          <Stat label="Latest Verified" value={formatTimestamp(record.latestVerifiedAt)} />
          <Stat label="Backend" value={record.proverBackend} />
        </div>
        <p className="mt-4 text-xs leading-relaxed text-slate-500">
          Cybyu proves what executed and what result was produced. A valid
          execution proof does not mean the program itself is correct.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Tests" value={String(record.testTotal)} />
        <Stat label="Passed" value={String(record.testPassed)} tone="good" />
        <Stat
          label="Failed"
          value={String(record.testFailed)}
          tone={record.testFailed ? "bad" : "muted"}
        />
        <Stat
          label="Test Result"
          value={record.testResult}
          tone={record.testResult === "PASS" ? "good" : "bad"}
          large
        />
      </section>

      <section className="rounded-2xl border border-ink-700 bg-ink-800 p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Execution Proof
        </h2>
        <p
          className={
            verifierOk
              ? "text-2xl font-semibold text-good"
              : "text-2xl font-semibold text-bad"
          }
        >
          {verifierOk ? "VALID" : "INVALID"}
        </p>
        <p className="mt-3 text-sm text-slate-400">
          A valid execution proof proves that the displayed test result was
          produced by the program whose Program Hash is shown above. It does
          not assert that the program is correct.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Stat
          label="Proof Generation Time"
          value={formatMs(record.proofGenerationMs)}
        />
        <Stat
          label="Verification Time"
          value={formatMs(record.latestVerificationMs)}
        />
        <Stat
          label="Proof Generated"
          value={formatTimestamp(record.proofGeneratedAt)}
        />
        <Stat label="Created" value={formatTimestamp(record.createdAt)} />
      </section>

      <section className="rounded-2xl border border-ink-700 bg-ink-800 p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Re-verify
        </h2>
        <p className="mb-3 text-sm text-slate-400">
          Re-verify invokes the real ZisK verifier against the stored authentic
          proof artifact for this record. It never executes the workload
          again.
        </p>
        <form action={`/api/proofs/${record.id}/reverify`} method="post">
          <button
            type="submit"
            className="rounded-xl bg-accent-600 px-5 py-2.5 text-sm font-semibold text-ink-900 transition hover:bg-accent-500"
          >
            Re-verify Proof
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-5 text-amber-200">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider">
          Reminder
        </h2>
        <p className="text-sm leading-relaxed">
          {record.testResult === "FAIL"
            ? "This workload is intentionally broken. The execution proof is authentic for the broken program; that is the point of the Cybyu Cadet demo."
            : "The workload executed as designed. A valid proof here still does not generalize: it certifies this execution only."}
        </p>
      </section>
    </main>
  );
}
