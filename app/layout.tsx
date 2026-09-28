import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Rubik } from "next/font/google";
import { profile } from "@/content/content";
import "./globals.css";

const body = Inter({ variable: "--font-body", subsets: ["latin"] });
const display = Rubik({ variable: "--font-display", subsets: ["latin"], weight: ["500", "700", "800", "900"] });
const mono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"] });

const description = `${profile.title} building agentic and RAG systems that check their own work: LangGraph, hybrid retrieval, LLM evaluation, FastAPI and GCP.`;

export const metadata: Metadata = {
  metadataBase: new URL(profile.url),
  title: `${profile.name} · ${profile.title}`,
  description,
  openGraph: {
    title: `${profile.name} · ${profile.title}`,
    description,
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable} ${mono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
