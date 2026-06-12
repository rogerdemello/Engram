import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mneme.app"),
  title: "Mneme — your AI's memory, owned by you",
  description:
    "Mneme is a user-owned, verifiable memory layer for AI agents. Your memories live on Walrus, encrypted; you grant and revoke each app's access on-chain; every answer is receipted. Built on Sui.",
  openGraph: {
    title: "Mneme — your AI's memory, owned by you and provably honest",
    description:
      "A verifiable memory layer for AI agents. Memories on Walrus, encrypted with Seal, shared only with your on-chain consent. Built on Sui.",
    images: ["/og.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mneme — your AI's memory, owned by you",
    description: "A verifiable memory layer for AI agents. Sui · Walrus · Seal.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
