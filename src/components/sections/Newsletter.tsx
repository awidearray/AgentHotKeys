"use client";

import { useState, type FormEvent } from "react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Something went wrong. Please try again.");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      id="newsletter"
      className="py-24"
      style={{
        background:
          "linear-gradient(180deg, transparent 0%, rgba(0,229,160,0.03) 50%, transparent 100%)",
      }}
    >
      <div className="max-w-[1100px] mx-auto px-6 relative z-1">
        <div className="max-w-[600px] mx-auto text-center">
          <span className="font-mono text-accent text-[13px] font-semibold tracking-[2px] uppercase mb-4 block">
            Free Weekly Insights
          </span>

          <h2 className="text-4xl font-extrabold mb-3">
            The HotKeys Newsletter
          </h2>

          <p className="text-text-dim mb-8 text-base">
            Weekly strategies, workflows, and hard-won lessons on building real
            software with AI agents. From a CTO who does this every day.
          </p>

          {!success ? (
            <>
              <form
                onSubmit={onSubmit}
                className="flex flex-col md:flex-row gap-3"
              >
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-5 py-4 bg-bg-card border border-border rounded-xl text-text-primary text-base font-sans outline-none focus:border-accent transition-colors placeholder:text-text-dim"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-4 bg-accent text-bg border-none rounded-xl font-bold text-base cursor-pointer transition-all hover:bg-accent-bright whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Subscribing..." : "Subscribe"}
                </button>
              </form>

              {error && (
                <p className="text-red-400 text-sm mt-3">{error}</p>
              )}

              <p className="text-text-dim text-xs mt-3">
                No spam. Unsubscribe anytime. Join developers who ship, not
                demo.
              </p>
            </>
          ) : (
            <p className="text-accent text-base font-semibold mt-4">
              You&apos;re in! Check your email for a confirmation.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
