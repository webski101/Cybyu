export type AdvisoryDoc = {
  id: string;
  title: string;
  source: string;
  country: string;
  url: string;
  tags: string[];
  body: string;
};

/**
 * Curated public-advisory excerpts for grounded citations.
 * These are paraphrased guidance patterns commonly published by regulators —
 * not legal advice. Prefer linking users to official reporting pages.
 */
export const ADVISORIES: AdvisoryDoc[] = [
  {
    id: "ng-efcc-advance-fee",
    title: "Advance-fee fraud patterns",
    source: "EFCC (Nigeria) — public awareness themes",
    country: "NG",
    url: "https://www.efcc.gov.ng/",
    tags: ["upfront fee", "processing fee", "registration fee", "nigeria", "job", "scholarship"],
    body: "Scammers often ask victims to pay a small fee first — for registration, visa processing, training materials, or unlocking a larger payout. Legitimate employers and scholarship bodies rarely require personal payment to begin a hiring or award process.",
  },
  {
    id: "ng-cbn-phishing",
    title: "Impersonation and urgent account alerts",
    source: "CBN / Nigerian financial-fraud awareness themes",
    country: "NG",
    url: "https://www.cbn.gov.ng/",
    tags: ["blocked account", "verify now", "otp", "bank", "urgent", "whatsapp"],
    body: "Fraudsters impersonate banks and payment platforms with urgent messages claiming an account is blocked. They push victims to click links, share OTPs, or move money. Banks do not ask for OTPs or passwords over WhatsApp or SMS.",
  },
  {
    id: "in-rbi-job",
    title: "Fake job and loan app red flags",
    source: "RBI / Indian cybercrime awareness themes",
    country: "IN",
    url: "https://www.rbi.org.in/",
    tags: ["loan", "job offer", "upi", "fee", "india", "work from home"],
    body: "Fake recruiters and illegal loan apps pressure people to pay joining fees or share UPI credentials. Cross-check company identity, never pay to get a job, and report financial fraud through official cybercrime channels.",
  },
  {
    id: "us-ftc-jobs",
    title: "Job scams that ask you to pay",
    source: "FTC (United States)",
    country: "US",
    url: "https://consumer.ftc.gov/articles/job-scams",
    tags: ["job", "work from home", "check", "overpayment", "fee", "united states"],
    body: "The FTC warns that job scams often promise easy money, ask for fees or personal financial information, or send fake checks. Real employers do not require you to pay for a job offer.",
  },
  {
    id: "us-ftc-scholarships",
    title: "Scholarship and grant scams",
    source: "FTC (United States)",
    country: "US",
    url: "https://consumer.ftc.gov/articles/how-avoid-scholarship-and-financial-aid-scams",
    tags: ["scholarship", "grant", "application fee", "guaranteed", "student"],
    body: "Scholarship scams guarantee awards, charge application fees, or request bank details to 'release funds.' Free official aid resources exist; treat guaranteed scholarships and fee-to-apply pitches as high risk.",
  },
  {
    id: "uk-ncsc-phishing",
    title: "Phishing and lookalike domains",
    source: "NCSC (United Kingdom)",
    country: "UK",
    url: "https://www.ncsc.gov.uk/collection/phishing-scams",
    tags: ["lookalike", "domain", "phishing", "urgent", "login"],
    body: "Attackers use lookalike domains and urgent language to rush people into clicking. Check the real domain carefully, hover before clicking, and verify unexpected offers through an official channel you already trust.",
  },
  {
    id: "global-remote-hiring",
    title: "Remote hiring hygiene",
    source: "tryui research brief (HackGlobal)",
    country: "GLOBAL",
    url: "https://www.interpol.int/Crimes/Cybercrime",
    tags: ["telegram", "whatsapp only", "crypto salary", "no interview", "gift card"],
    body: "High-risk remote offers often skip interviews, move immediately to Telegram/WhatsApp, pay only in crypto or gift cards, or refuse company email domains. Ask for a company domain email, a video interview, and a verifiable careers page.",
  },
  {
    id: "ng-ncc-sms",
    title: "Suspicious SMS and short links",
    source: "Nigerian consumer-protection / telecom awareness themes",
    country: "NG",
    url: "https://www.ncc.gov.ng/",
    tags: ["sms", "short link", "click here", "prize", "airtime"],
    body: "Prize and airtime messages with short links are a common lure. Do not click unknown links; confirm campaigns through the brand's official site or app instead of the message itself.",
  },
];

export function retrieveCitations(text: string, limit = 3) {
  const hay = text.toLowerCase();
  const scored = ADVISORIES.map((doc) => {
    let score = 0;
    for (const tag of doc.tags) {
      if (hay.includes(tag.toLowerCase())) score += 3;
    }
    for (const word of doc.body.toLowerCase().split(/\W+/)) {
      if (word.length > 5 && hay.includes(word)) score += 0.15;
    }
    if (hay.includes("nigeria") || hay.includes("naira") || hay.includes("lagos")) {
      if (doc.country === "NG") score += 2;
    }
    if (hay.includes("india") || hay.includes("upi") || hay.includes("rupee")) {
      if (doc.country === "IN") score += 2;
    }
    if (hay.includes("uk") || hay.includes("britain") || hay.includes("london")) {
      if (doc.country === "UK") score += 2;
    }
    if (hay.includes("usa") || hay.includes("united states") || hay.includes("usd $")) {
      if (doc.country === "US") score += 2;
    }
    return { doc, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  if (scored.length === 0) {
    return ADVISORIES.filter((d) => d.id === "global-remote-hiring" || d.id === "us-ftc-jobs").slice(0, 2);
  }
  return scored.map((s) => s.doc);
}
