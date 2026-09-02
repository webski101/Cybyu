import Link from "next/link";

const stages: Array<{ key: string; label: string }> = [
  { key: "program", label: "Program" },
  { key: "tests", label: "Tests" },
  { key: "execute", label: "Execute" },
  { key: "zisk-proof", label: "ZisK Proof" },
  { key: "verify", label: "Verify" },
  { key: "result", label: "Result" }
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-stretch gap-12 px-6 py-16">
      <header className="flex flex-col gap-4">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent-500">
          CyOps Cadet MVP
        </span>
        <h1 className="text-5xl font-semibold leading-tight tracking-tight">
          Cybyu
        </h1>
        <p className="text-xl text-accent-500">
          AI says the code works. Cybyu proves what actually happened.
        </p>
        <p className="max-w-2xl text-base leading-relaxed text-slate-300">
          Cybyu turns software test executions into independently verifiable
          cryptographic results using Cysic&rsquo;s ZisK proving technology.
          You see a test outcome. You also see whether that outcome was
          produced by the program that was supposed to run.
        </p>
      </header>

      <section className="rounded-2xl border border-ink-700 bg-ink-800 p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Workflow
        </h2>
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-6">
          {stages.map((stage, index) => (
            <li
              key={stage.key}
              className="flex flex-col items-center gap-2 rounded-xl border border-ink-700 bg-ink-900 px-3 py-3 text-center"
            >
              <span className="font-mono text-xs text-slate-500">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-sm font-semibold text-slate-200">
                {stage.label}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-6 text-amber-200">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider">
          Important distinction
        </h2>
        <p className="text-base leading-relaxed">
          A cryptographically valid execution proof proves what executed.
          It does <strong>not</strong> prove that the software is correct. A
          program can execute exactly as written and still be wrong; Cybyu
          makes that distinction explicit instead of hiding it.
        </p>
      </section>

      <footer className="flex items-center justify-between border-t border-ink-700 pt-6">
        <p className="text-sm text-slate-400">
          Two allowlisted Cadet workloads. No arbitrary code.
        </p>
        <Link
          href="/prove"
          className="inline-flex items-center gap-2 rounded-xl bg-accent-600 px-5 py-3 text-sm font-semibold text-ink-900 transition hover:bg-accent-500"
        >
          Run Verified Test
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </footer>
    </main>
  );
}