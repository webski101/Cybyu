import type { Metadata } from "next";
import { Manrope, Syne } from "next/font/google";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "tryui — offer go / no-go briefs",
  description:
    "Paste a job, scholarship, or internship offer. Get a shareable go / no-go brief with red flags, citations, and next steps.",
  openGraph: {
    title: "tryui",
    description:
      "Decision briefs for suspicious offers — built for HackGlobal 2026.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${syne.variable} ${manrope.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
