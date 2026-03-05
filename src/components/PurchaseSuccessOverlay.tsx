"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function PurchaseSuccessOverlay() {
  const searchParams = useSearchParams();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (searchParams.get("purchase") === "success") {
      setShow(true);
      // Clean the URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-bg/95 z-[9999] flex items-center justify-center p-6">
      <div className="bg-bg-card border-2 border-accent rounded-2xl p-12 max-w-[500px] w-full text-center relative overflow-hidden">
        <div className="radial-glow absolute -top-24 left-1/2 -translate-x-1/2 w-[400px] h-[400px]" />
        <div className="relative z-10">
          <div className="text-5xl mb-4">&#10003;</div>
          <h2 className="text-[28px] font-extrabold mb-3 text-text-primary">
            You&apos;re In.
          </h2>
          <p className="text-text-dim mb-8">
            Your Agentic Command Keys guide is ready. Click below to download
            your PDF.
          </p>
          <a
            href="/Agentic_Command_Keys.pdf"
            download
            className="inline-block bg-accent text-bg px-9 py-4 rounded-xl font-bold text-base no-underline hover:bg-accent-bright hover:-translate-y-0.5 transition-all duration-300 mb-4"
          >
            Download Your PDF
          </a>
          <p className="text-text-dim text-[13px] mt-4">
            Welcome to the team.
          </p>
          <button
            onClick={() => setShow(false)}
            className="mt-5 bg-transparent border border-border text-text-dim px-5 py-2 rounded-lg cursor-pointer text-[13px] hover:border-accent hover:text-accent transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
