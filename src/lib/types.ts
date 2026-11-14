export type Verdict = "go" | "caution" | "no_go";

export type OfferType =
  | "job"
  | "scholarship"
  | "internship"
  | "loan"
  | "investment"
  | "other";

export type Flag = {
  id: string;
  severity: "low" | "medium" | "high";
  title: string;
  detail: string;
};

export type Citation = {
  id: string;
  title: string;
  source: string;
  country: string;
  url: string;
  excerpt: string;
};

export type NextStep = {
  label: string;
  detail: string;
  url?: string;
};

export type AnalysisResult = {
  id: string;
  createdAt: string;
  verdict: Verdict;
  score: number;
  headline: string;
  summary: string;
  offerType: OfferType;
  country: string | null;
  flags: Flag[];
  citations: Citation[];
  questions: string[];
  nextSteps: NextStep[];
  inputPreview: string;
  engine: "rules" | "rules+llm";
};
