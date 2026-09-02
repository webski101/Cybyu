import Link from "next/link";

type WorkloadId = "correct" | "buggy";

type Workload = {
  id: WorkloadId;
  title: string;
  description: string;
  expectedSummary: string;
};

const WORKLOADS: Workload[] = [
  {
    id: "correct",
    title: "Correct Calculator",
    description:
      "A correct multiplication implementation. Runs the three fixed tests against the canonical vectors.",
    expectedSummary: "3/3 tests pass"
  },
  {
    id: "buggy",
    title: "Buggy Calculator",
    description:
      "An intentionally broken implementation that adds instead of multiplies. Tests fail by design.",
    expectedSummary: "tests fail"
  }
];

export default function ProvePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-3">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-[0.2em] text-accent-500 hover:text-accent-600"
        >
          &larr; Cybyu
        </Link>
        <h1 className="text-3xl font-semibold">Run Verified Test</h1>
        <p className="text-sm text-slate-300">
          Choose one of the two allowlisted Cadet workloads.
        </p>
      </header>

      <aside className="rounded-xl border border-accent-500/25 bg-accent-500/5 px-4 py-3 text-sm leading-relaxed text-slate-300">
        <div className="flex flex-col gap-3">
          <h2 className="font-semibold text-slate-100">
            Valid proof does not mean correct software.
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-ink-700 bg-ink-900/60 px-3 py-2">
              <p className="font-semibold text-slate-200">Correct Calculator</p>
              <p className="mt-1 flex flex-wrap gap-2 font-mono text-xs uppercase tracking-wider">
                <span className="text-good">Tests PASS</span>
                <span className="text-slate-600">+</span>
                <span className="text-good">Execution proof VALID</span>
              </p>
            </div>
            <div className="rounded-lg border border-ink-700 bg-ink-900/60 px-3 py-2">
              <p className="font-semibold text-slate-200">Buggy Calculator</p>
              <p className="mt-1 flex flex-wrap gap-2 font-mono text-xs uppercase tracking-wider">
                <span className="text-bad">Tests FAIL</span>
                <span className="text-slate-600">+</span>
                <span className="text-good">Execution proof VALID</span>
              </p>
            </div>
          </div>
          <p>
            Cybyu proves what actually executed and what result it produced. It
            does not claim that the program itself is correct.
          </p>
          <p className="text-xs text-slate-500">
            This demo executes the selected workload, loads its preserved
            authentic ZisK proof, and re-verifies that proof live. It does not
            generate a new proof on every click.
          </p>
        </div>
      </aside>

      <ul className="flex flex-col gap-4">
        {WORKLOADS.map((workload) => (
          <li
            key={workload.id}
            className="rounded-2xl border border-ink-700 bg-ink-800 p-5"
          >
            <form
              action={`/api/workloads/${workload.id}/run`}
              method="post"
              className="flex flex-col gap-3"
            >
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-slate-100">
                  {workload.title}
                </h2>
                <p className="text-sm text-slate-400">
                  {workload.description}
                </p>
                <p className="font-mono text-xs uppercase tracking-wider text-slate-500">
                  Expected: {workload.expectedSummary}
                </p>
              </div>
              <button
                type="submit"
                className="self-start rounded-xl bg-accent-600 px-5 py-2.5 text-sm font-semibold text-ink-900 transition hover:bg-accent-500"
              >
                Run Verified Demo
              </button>
            </form>
          </li>
        ))}
      </ul>

      <section className="rounded-2xl border border-ink-700 bg-ink-800 p-5 text-sm text-slate-300">
        <h2 className="mb-2 font-semibold text-slate-200">Stages</h2>
        <ol className="grid grid-cols-1 gap-2 sm:grid-cols-5">
          {[
            "Preparing",
            "Executing tests",
            "Loading proof",
            "Verifying proof",
            "Complete"
          ].map((stage) => (
            <li
              key={stage}
              className="rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-center font-mono text-xs uppercase tracking-wider text-slate-400"
            >
              {stage}
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-slate-500">
          The demo loads the selected workload&rsquo;s preserved authentic ZisK
          proof and verifies it live. Stages advance only when the real external
          runner reports completion.
        </p>
      </section>
    </main>
  );
}