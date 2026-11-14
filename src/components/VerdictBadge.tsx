import type { Verdict } from "@/lib/types";

const LABELS: Record<Verdict, string> = {
  go: "GO",
  caution: "CAUTION",
  no_go: "NO-GO",
};

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  return (
    <span className={`verdict verdict-${verdict}`} data-verdict={verdict}>
      {LABELS[verdict]}
    </span>
  );
}
