import { sql } from "./db";
import type { AnalysisResult } from "./types";

type ResultRow = {
  id: string;
  created_at: string;
  country: string | null;
  offer_type: string;
  verdict: string;
  score: number;
  headline: string;
  summary: string;
  payload: AnalysisResult | string;
};

export async function saveResult(result: AnalysisResult): Promise<void> {
  await sql(
    `insert into results (id, created_at, country, offer_type, verdict, score, headline, summary, payload)
     values ($1, $2::timestamptz, $3, $4, $5, $6, $7, $8, $9::jsonb)`,
    [
      result.id,
      result.createdAt,
      result.country,
      result.offerType,
      result.verdict,
      result.score,
      result.headline,
      result.summary,
      JSON.stringify(result),
    ],
  );
}

export async function getResult(id: string): Promise<AnalysisResult | null> {
  const rows = await sql<ResultRow>(
    `select id, created_at, country, offer_type, verdict, score, headline, summary, payload
     from results where id = $1 limit 1`,
    [id],
  );
  const row = rows[0];
  if (!row) return null;
  if (typeof row.payload === "string") {
    return JSON.parse(row.payload) as AnalysisResult;
  }
  return row.payload;
}

export async function countResults(): Promise<number> {
  const rows = await sql<{ count: number | string }>(
    `select count(*)::int as count from results`,
  );
  return Number(rows[0]?.count ?? 0);
}
