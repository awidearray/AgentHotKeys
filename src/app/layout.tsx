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
  metadataBase: new URL("https://agenthotkeys.com"),
  title: {
    default: "Agentic Command Keys — Logan Golema | AlphaTON Capital",
    template: "%s | Agentic Command Keys",
  },
  description:
    "13 hotkeys that turn AI into a real engineer. From the CTO of AlphaTON Capital. Stop watching AI pretend. Start commanding it.",
  openGraph: {
    title: "Agentic Command Keys",
    description:
      "13 hotkeys that turn AI into a real engineer. From the CTO of AlphaTON Capital.",
    url: "https://agenthotkeys.com",
    siteName: "Agentic Command Keys",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Agentic Command Keys",
    description: "13 hotkeys that turn AI into a real engineer.",
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
