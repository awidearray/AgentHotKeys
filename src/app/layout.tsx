import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import GridBackground from "@/components/ui/GridBackground";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
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
    default: "HotKeys.ai — 13 Command Keys That Make AI Ship Real Code",
    template: "%s | HotKeys.ai",
  },
  description:
    "13 keyboard shortcuts that enforce real engineering discipline on AI agents. No stubs. No placeholders. No theater. From the CTO of AlphaTON Capital.",
  openGraph: {
    title: "HotKeys.ai — Stop Watching AI Pretend to Code",
    description:
      "13 command keys that force AI agents to write production-grade code. Built by a CTO who got tired of AI theater.",
    url: "https://hotkeys.ai",
    siteName: "HotKeys.ai",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HotKeys.ai — Stop Watching AI Pretend to Code",
    description:
      "13 command keys that force AI agents to write production-grade code. No stubs. No mocks. No theater.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased">
        <GridBackground>
          <Navbar />
          {children}
          <Footer />
        </GridBackground>
      </body>
    </html>
  );
}
