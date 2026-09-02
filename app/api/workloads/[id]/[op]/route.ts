import { NextRequest, NextResponse } from "next/server";
import { runFullPipeline } from "@/lib/adapter";
import { buildVercelDemoRecord, demoProofId } from "@/lib/vercel-demo";
import { isWorkloadId } from "@/lib/workloads";

type Params = { id: string; op: string };

export async function POST(
  request: NextRequest,
  { params }: { params: Params }
): Promise<NextResponse> {
  if (params.op !== "run") {
    return NextResponse.json({ error: "unknown operation" }, { status: 404 });
  }
  if (!isWorkloadId(params.id)) {
    return NextResponse.json({ error: "unknown workload" }, { status: 404 });
  }

  if (process.env.VERCEL) {
    try {
      await buildVercelDemoRecord(params.id);
      return NextResponse.redirect(
        new URL(`/proof/${demoProofId(params.id)}`, request.url),
        { status: 303 }
      );
    } catch (error) {
      return NextResponse.json(
        {
          error: "pipeline_failed",
          result: {
            ok: false,
            stages: [
              { stage: "preparing", at: new Date().toISOString(), ok: true },
              { stage: "executing", at: new Date().toISOString(), ok: true },
              {
                stage: "verifying-proof",
                at: new Date().toISOString(),
                ok: false,
                message: (error as Error).message
              }
            ],
            proofId: "",
            workloadId: params.id
          }
        },
        { status: 500 }
      );
    }
  }

  const result = await runFullPipeline(params.id);
  if (!result.ok) {
    return NextResponse.json({ error: "pipeline_failed", result }, { status: 500 });
  }
  return NextResponse.redirect(new URL(`/proof/${result.proofId}`, request.url), {
    status: 303
  });
}

export const GET = POST;
