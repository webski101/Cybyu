import { NextResponse } from "next/server";
import { countResults } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  try {
    const checks = await countResults();
    return NextResponse.json({
      ok: true,
      service: "tryui",
      host: process.env.TRYUI_HOST || "local",
      checks,
      llm: Boolean(process.env.OPENAI_API_KEY?.trim()),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "health failed",
      },
      { status: 500 },
    );
  }
}
