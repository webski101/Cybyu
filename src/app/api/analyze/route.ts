import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeOfferWithOptionalLlm } from "@/lib/analyze";
import { saveResult } from "@/lib/store";

export const runtime = "nodejs";

const bodySchema = z.object({
  text: z.string().min(12).max(12000),
  countryHint: z.string().max(8).optional(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Paste the offer text (at least a short paragraph)." },
        { status: 400 },
      );
    }

    const result = await analyzeOfferWithOptionalLlm(
      parsed.data.text,
      parsed.data.countryHint,
    );
    await saveResult(result);

    return NextResponse.json({ result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
