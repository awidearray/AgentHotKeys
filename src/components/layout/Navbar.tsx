'use client';

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Navbar() {
  const { data: session, status } = useSession();
  return (
    <nav className="fixed top-0 left-0 right-0 z-100 bg-bg/85 backdrop-blur-xl border-b border-border">
      <div className="max-w-[1100px] mx-auto px-4 md:px-6 flex items-center justify-between h-16">
        <Link href="/" className="font-mono font-bold text-base md:text-lg text-accent no-underline">
          <span className="text-text-primary">HOT</span>KEYS<span className="text-text-dim">.ai</span>
        </Link>
        <div className="flex gap-4 md:gap-8 items-center">
          <Link
            href="/marketplace"
            className="hidden md:inline text-text-dim no-underline text-sm font-medium hover:text-accent transition-colors"
          >
            Marketplace
          </Link>
          <Link
            href="/community"
            className="hidden md:inline text-text-dim no-underline text-sm font-medium hover:text-accent transition-colors"
          >
            Community
          </Link>
          {status === 'authenticated' ? (
            <>
              <Link
                href="/dashboard"
                className="hidden md:inline text-text-dim no-underline text-sm font-medium hover:text-accent transition-colors"
              >
                Dashboard
              </Link>
              <ConnectButton.Custom>
                {({ account, chain, openConnectModal, mounted }) => {
                  const connected = mounted && account && chain;
                  if (!connected) {
                    return (
                      <button
                        onClick={openConnectModal}
                        className="hidden md:inline px-3 py-1.5 bg-bg border border-border rounded-lg text-xs font-medium hover:border-accent transition-all"
                      >
                        Connect Wallet
                      </button>
                    );
                  }
                  return (
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-bg border border-accent rounded-lg text-xs">
                      <span className="text-accent">{account.displayName}</span>
                    </div>
                  );
                }}
              </ConnectButton.Custom>
              <button
                onClick={() => signOut()}
                className="px-3 py-1.5 md:px-4 md:py-2 bg-bg border border-border rounded-lg text-xs md:text-sm font-medium hover:border-accent transition-all"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="text-text-dim no-underline text-sm font-medium hover:text-accent transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="bg-accent text-bg px-3 py-1.5 md:px-5 md:py-2 rounded-lg font-semibold text-xs md:text-sm hover:bg-accent-bright hover:-translate-y-0.5 transition-all duration-300 whitespace-nowrap"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
