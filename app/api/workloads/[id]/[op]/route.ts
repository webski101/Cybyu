import { NextRequest, NextResponse } from "next/server";
import { runFullPipeline } from "@/lib/adapter";
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
  const result = await runFullPipeline(params.id);
  if (!result.ok) {
    return NextResponse.json({ error: "pipeline_failed", result }, { status: 500 });
  }
  return NextResponse.redirect(new URL(`/proof/${result.proofId}`, request.url), {
    status: 303
  });
}

export const GET = POST;