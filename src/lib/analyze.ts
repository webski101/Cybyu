import { customAlphabet } from "nanoid";
import { retrieveCitations } from "./corpus";
import type {
  AnalysisResult,
  Flag,
  NextStep,
  OfferType,
  Verdict,
} from "./types";

const nanoid = customAlphabet("abcdefghijkmnopqrstuvwxyz23456789", 10);

type Rule = {
  id: string;
  pattern: RegExp;
  severity: Flag["severity"];
  title: string;
  detail: string;
  weight: number;
};

const RULES: Rule[] = [
  {
    id: "upfront-fee",
    pattern:
      /\b(registration fee|processing fee|activation fee|admin fee|pay\s?\$?\d+|send(ing)? money|gift ?cards?|wire transfer|western union|upfront|before we (can )?proceed)\b/i,
    severity: "high",
    title: "Asks for money first",
    detail:
      "Legitimate employers and scholarship bodies almost never require you to pay to unlock an offer.",
    weight: 34,
  },
  {
    id: "urgency",
    pattern:
      /\b(urgent|immediately|act now|within 24 hours|today only|last chance|account (will be )?block(ed)?|suspend(ed)?)\b/i,
    severity: "medium",
    title: "Pressure and urgency",
    detail:
      "Scammers shrink your time to think. Real processes leave room to verify.",
    weight: 14,
  },
  {
    id: "crypto-pay",
    pattern:
      /\b(bitcoin|btc|usdt|crypto(currency)?|binance|wallet address|seed phrase)\b/i,
    severity: "high",
    title: "Crypto-only payment path",
    detail:
      "Salary or fees routed only through crypto are a common scam pattern for remote offers.",
    weight: 28,
  },
  {
    id: "chat-only",
    pattern:
      /\b(whatsapp only|message me on (whatsapp|telegram)|chat on telegram|dm me for (details|job)|no email)\b/i,
    severity: "medium",
    title: "Moves off official channels",
    detail:
      "Offers that refuse company email or careers pages and live only on chat apps are high risk.",
    weight: 18,
  },
  {
    id: "guaranteed",
    pattern:
      /\b(guaranteed (scholarship|job|income|approval)|100% approved|no interview|earn \$?\d+\s*(a|per)\s*(day|week)|easy money)\b/i,
    severity: "high",
    title: "Guaranteed outcome / no process",
    detail:
      "Guarantees and skipped interviews are classic bait for fake jobs and scholarships.",
    weight: 26,
  },
  {
    id: "secrets",
    pattern:
      /\b(otp|one[- ]time password|send (your )?(pin|password|bvn|nin|ssn|routing number)|verify your (card|account))\b/i,
    severity: "high",
    title: "Requests secrets or IDs for access",
    detail:
      "Never share OTPs, passwords, or full government IDs to 'release' an offer.",
    weight: 36,
  },
  {
    id: "lookalike-mail",
    pattern:
      /\b[\w.-]+@(gmail|yahoo|outlook|hotmail|proton)\.com\b/i,
    severity: "low",
    title: "Personal email domain",
    detail:
      "Not always fraudulent, but serious recruiters usually write from a company domain. Verify the organization independently.",
    weight: 8,
  },
  {
    id: "short-link",
    pattern: /\b(bit\.ly|tinyurl\.com|t\.co|cutt\.ly|rb\.gy)\/\S+/i,
    severity: "medium",
    title: "Opaque short link",
    detail:
      "Short links hide the real destination. Prefer official career or scholarship URLs.",
    weight: 12,
  },
  {
    id: "overpayment",
    pattern:
      /\b(overpay|extra check|purchase (equipment|laptop) and (keep|send back)|buy gift cards? for (clients|training))\b/i,
    severity: "high",
    title: "Overpayment / equipment purchase trap",
    detail:
      "Fake check and equipment-purchase schemes are well-documented job scams.",
    weight: 30,
  },
  {
    id: "scholarship-fee",
    pattern:
      /\b(scholarship).{0,40}\b(fee|payment|processing)\b|\b(pay).{0,40}\b(scholarship|grant)\b/i,
    severity: "high",
    title: "Pay-to-apply scholarship signal",
    detail:
      "Treat scholarships that require payment to apply or release funds as suspicious until proven otherwise.",
    weight: 30,
  },
];

function detectOfferType(text: string): OfferType {
  const t = text.toLowerCase();
  if (/\b(scholarship|bursary|grant|tuition)\b/.test(t)) return "scholarship";
  if (/\b(intern(ship)?|industrial training|siwes)\b/.test(t)) return "internship";
  if (/\b(loan|credit|emi|apr)\b/.test(t)) return "loan";
  if (/\b(invest|forex|trading signal|roi|profit)\b/.test(t)) return "investment";
  if (/\b(job|hiring|recruit|role|salary|position|vacancy)\b/.test(t)) return "job";
  return "other";
}

function detectCountry(text: string): string | null {
  const t = text.toLowerCase();
  if (/\b(nigeria|naira|ngn|lagos|abuja|efcc|bvn)\b/.test(t)) return "NG";
  if (/\b(india|upi|inr|rupee|mumbai|bengaluru)\b/.test(t)) return "IN";
  if (/\b(united kingdom|uk\b|london|gbp|£)\b/.test(t)) return "UK";
  if (/\b(united states|usa|usd|\$\d+|irs|ssn)\b/.test(t)) return "US";
  return null;
}

function scoreToVerdict(score: number): Verdict {
  if (score >= 45) return "no_go";
  if (score >= 18) return "caution";
  return "go";
}

function buildQuestions(offerType: OfferType, flags: Flag[]): string[] {
  const base = [
    "Can you send this from an official company or institution email domain?",
    "Where is the public careers / scholarship page that lists this exact offer?",
    "What is the verification process before any payment or personal documents?",
  ];
  if (offerType === "scholarship") {
    base.push("Is there a free official application portal that does not charge a release fee?");
  }
  if (flags.some((f) => f.id === "chat-only")) {
    base.push("Can we schedule a video call with someone listed on the official website?");
  }
  return base.slice(0, 5);
}

function buildNextSteps(country: string | null, verdict: Verdict): NextStep[] {
  const steps: NextStep[] = [
    {
      label: "Pause before paying or sharing secrets",
      detail:
        "Do not send money, gift cards, OTPs, or ID scans until the organization is independently verified.",
    },
    {
      label: "Verify on an official channel",
      detail:
        "Search the organization yourself and contact them via a number or email published on their real website — not the message thread.",
    },
  ];

  if (country === "NG") {
    steps.push({
      label: "Report in Nigeria",
      detail: "Use EFCC / national cybercrime reporting channels if money or identity was requested.",
      url: "https://www.efcc.gov.ng/",
    });
  } else if (country === "IN") {
    steps.push({
      label: "Report in India",
      detail: "Use the national cybercrime reporting portal for online fraud.",
      url: "https://cybercrime.gov.in/",
    });
  } else if (country === "US") {
    steps.push({
      label: "Report in the US",
      detail: "File a report with ReportFraud.ftc.gov for job or scholarship scams.",
      url: "https://reportfraud.ftc.gov/",
    });
  } else if (country === "UK") {
    steps.push({
      label: "Report in the UK",
      detail: "Report phishing and fraud via NCSC / Action Fraud guidance.",
      url: "https://www.ncsc.gov.uk/collection/phishing-scams",
    });
  } else {
    steps.push({
      label: "Report locally",
      detail:
        "Use your country's cybercrime or consumer-protection reporting channel and warn the group chat where the offer appeared.",
    });
  }

  if (verdict === "go") {
    steps.unshift({
      label: "Still do light due diligence",
      detail:
        "Low risk is not zero risk. Confirm the sender domain and the public listing before sharing documents.",
    });
  }

  return steps;
}

function headlineFor(verdict: Verdict, offerType: OfferType): string {
  const label =
    offerType === "other" ? "offer" : offerType.replace("_", " ");
  if (verdict === "no_go") return `No-go: this ${label} looks high risk`;
  if (verdict === "caution") return `Caution: verify before you proceed`;
  return `Go (with checks): no major scam markers found`;
}

export function analyzeOffer(rawText: string): AnalysisResult {
  const text = rawText.trim().replace(/\s+/g, " ");
  if (text.length < 12) {
    throw new Error("Paste a longer offer message (at least a few sentences).");
  }

  const flags: Flag[] = [];
  let risk = 0;
  for (const rule of RULES) {
    if (rule.pattern.test(text)) {
      flags.push({
        id: rule.id,
        severity: rule.severity,
        title: rule.title,
        detail: rule.detail,
      });
      risk += rule.weight;
    }
  }

  // Slight boost when multiple high-severity flags stack
  const highCount = flags.filter((f) => f.severity === "high").length;
  if (highCount >= 2) risk += 10;

  const score = Math.max(0, Math.min(100, risk));
  const verdict = scoreToVerdict(score);
  const offerType = detectOfferType(text);
  const country = detectCountry(text);
  const docs = retrieveCitations(text, 3);

  const summary =
    verdict === "no_go"
      ? "Multiple high-risk patterns match known scam playbooks. Treat this as unsafe until proven otherwise through official channels."
      : verdict === "caution"
        ? "Some warning signs are present. Do not pay or share secrets yet — verify the organization independently first."
        : "We did not find strong scam markers in the text. Still confirm the sender and the public listing before sharing documents.";

  return {
    id: nanoid(),
    createdAt: new Date().toISOString(),
    verdict,
    score,
    headline: headlineFor(verdict, offerType),
    summary,
    offerType,
    country,
    flags,
    citations: docs.map((d) => ({
      id: d.id,
      title: d.title,
      source: d.source,
      country: d.country,
      url: d.url,
      excerpt: d.body,
    })),
    questions: buildQuestions(offerType, flags),
    nextSteps: buildNextSteps(country, verdict),
    inputPreview: text.slice(0, 280),
    engine: "rules",
  };
}

export async function analyzeOfferWithOptionalLlm(
  rawText: string,
): Promise<AnalysisResult> {
  const base = analyzeOffer(rawText);
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return base;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You refine a scam/offer risk brief. Return JSON with keys: summary (string), extraFlags (array of {title, detail, severity}), questions (string array max 5). Never call an offer 'safe'. Be concise.",
          },
          {
            role: "user",
            content: JSON.stringify({
              offer: rawText.slice(0, 4000),
              current: {
                verdict: base.verdict,
                score: base.score,
                flags: base.flags,
                summary: base.summary,
              },
            }),
          },
        ],
      }),
    });

    if (!res.ok) return base;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return base;
    const parsed = JSON.parse(content) as {
      summary?: string;
      extraFlags?: { title: string; detail: string; severity?: Flag["severity"] }[];
      questions?: string[];
    };

    if (parsed.summary) base.summary = parsed.summary;
    if (parsed.extraFlags?.length) {
      for (const f of parsed.extraFlags.slice(0, 3)) {
        base.flags.push({
          id: `llm-${base.flags.length}`,
          severity: f.severity || "medium",
          title: f.title,
          detail: f.detail,
        });
      }
    }
    if (parsed.questions?.length) {
      base.questions = parsed.questions.slice(0, 5);
    }
    base.engine = "rules+llm";
    return base;
  } catch {
    return base;
  }
}
