import Link from "next/link";

export default function Footer() {
  return (
    <footer className="py-12 border-t border-border relative z-1">
      <div className="max-w-[1100px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-center">
        <div className="text-text-dim text-[13px]">
          &copy; 2026 Logan Golema / AlphaTON Capital. All rights reserved.
        </div>
        <div className="flex gap-6">
          <a
            href="https://AlphaTONCapital.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-dim no-underline text-[13px] hover:text-accent transition-colors"
          >
            AlphaTONCapital.com
          </a>
          <Link
            href="#newsletter"
            className="text-text-dim no-underline text-[13px] hover:text-accent transition-colors"
          >
            Newsletter
          </Link>
          <Link
            href="#pricing"
            className="text-text-dim no-underline text-[13px] hover:text-accent transition-colors"
          >
            Buy the Guide
          </Link>
        </div>
      </div>
    </footer>
  );
}
