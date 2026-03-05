import Link from "next/link";
import Button from "@/components/ui/Button";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-100 bg-bg/85 backdrop-blur-xl border-b border-border">
      <div className="max-w-[1100px] mx-auto px-4 md:px-6 flex items-center justify-between h-16">
        <Link href="/" className="font-mono font-bold text-base md:text-lg text-accent no-underline">
          <span className="text-text-primary">AGENTIC</span>KEYS
        </Link>
        <div className="flex gap-8 items-center">
          <Link
            href="#story"
            className="hidden md:inline text-text-dim no-underline text-sm font-medium hover:text-accent transition-colors"
          >
            My Story
          </Link>
          <Link
            href="#commands"
            className="hidden md:inline text-text-dim no-underline text-sm font-medium hover:text-accent transition-colors"
          >
            The Keys
          </Link>
          <Link
            href="#pricing"
            className="hidden md:inline text-text-dim no-underline text-sm font-medium hover:text-accent transition-colors"
          >
            Get It
          </Link>
          <a
            href="#newsletter"
            className="bg-accent text-bg px-3 py-1.5 md:px-5 md:py-2 rounded-lg font-semibold text-xs md:text-sm hover:bg-accent-bright hover:-translate-y-0.5 transition-all duration-300 whitespace-nowrap"
          >
            Subscribe
          </a>
        </div>
      </div>
    </nav>
  );
}
