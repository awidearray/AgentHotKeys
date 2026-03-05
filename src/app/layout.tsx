import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import GridBackground from "@/components/ui/GridBackground";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Web3Provider } from "@/components/providers/Web3Provider";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://hotkeys.ai"),
  title: {
    default: "AI Coding Hotkeys — 13 Command Keys for AI Agents | HotKeys.ai",
    template: "%s | HotKeys.ai",
  },
  description:
    "13 keyboard shortcuts that force AI agents to write production-grade code. No stubs, no placeholders, no theater. Works with Claude, Cursor, Copilot, and GPT. $35 one-time.",
  keywords: [
    "AI coding hotkeys",
    "AI agent keyboard shortcuts",
    "command keys for AI",
    "AI coding discipline",
    "stop AI from writing stubs",
    "make AI write real code",
    "cursor AI shortcuts",
    "claude code command keys",
    "AI coding prompts",
    "AI engineering hotkeys",
    "agentic development",
    "AI code quality",
  ],
  alternates: {
    canonical: "https://hotkeys.ai",
  },
  openGraph: {
    title: "Your AI writes beautiful code that doesn't work. Fix it with 13 hotkeys.",
    description:
      "Keyboard shortcuts that enforce real engineering discipline on AI agents. Built by a CTO who got tired of AI theater. Works with Claude, Cursor, GPT, Copilot.",
    url: "https://hotkeys.ai",
    siteName: "HotKeys.ai",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stop watching AI pretend to code.",
    description:
      "13 hotkeys that force AI to ship real code. No stubs. No mocks. No theater. From a CTO who builds with AI every day.",
    site: "@logangolema",
  },
  robots: { index: true, follow: true },
  authors: [{ name: "Logan Golema", url: "https://logangolema.com" }],
  creator: "Logan Golema",
  publisher: "HotKeys.ai",
  category: "Technology",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased">
        <ErrorBoundary>
          <AuthProvider>
            <Web3Provider>
              <ErrorBoundary>
                <GridBackground>
                  <Navbar />
                  <ErrorBoundary>
                    {children}
                  </ErrorBoundary>
                  <Footer />
                </GridBackground>
              </ErrorBoundary>
            </Web3Provider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
