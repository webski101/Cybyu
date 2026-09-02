import { NextRequest, NextResponse } from "next/server";
import { reverifyStoredProof } from "@/lib/adapter";

type Params = { id: string };

export async function POST(
  request: NextRequest,
  { params }: { params: Params }
): Promise<NextResponse> {
  const result = await reverifyStoredProof(params.id);
  if (!result.ok && !result.record) {
    return NextResponse.json({ error: result.reason ?? "failed" }, { status: 404 });
  }
  return NextResponse.redirect(new URL(`/proof/${params.id}`, request.url), {
    status: 303
  });
}

export const GET = POST;