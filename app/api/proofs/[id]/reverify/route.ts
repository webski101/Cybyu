import { NextRequest, NextResponse } from "next/server";
import { reverifyStoredProof } from "@/lib/adapter";
import { parseDemoProofId } from "@/lib/vercel-demo";
import { verifyBundledProof } from "@/lib/vercel-verifier";

type Params = { id: string };

export async function POST(
  request: NextRequest,
  { params }: { params: Params }
): Promise<NextResponse> {
  if (process.env.VERCEL) {
    const workloadId = parseDemoProofId(params.id);
    if (!workloadId) {
      return NextResponse.json({ error: "proof not found" }, { status: 404 });
    }
    try {
      await verifyBundledProof(workloadId);
      return NextResponse.redirect(
        new URL(`/proof/${params.id}?reverified=1`, request.url),
        { status: 303 }
      );
    } catch (error) {
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 500 }
      );
    }
  }

  const result = await reverifyStoredProof(params.id);
  if (!result.ok && !result.record) {
    return NextResponse.json({ error: result.reason ?? "failed" }, { status: 404 });
  }
  return NextResponse.redirect(new URL(`/proof/${params.id}`, request.url), {
    status: 303
  });
}

export const GET = POST;
