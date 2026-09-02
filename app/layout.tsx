import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cybyu — Prove what actually happened",
  description:
    "Cybyu turns software test executions into independently verifiable results using Cysic ZisK proving technology.",
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}