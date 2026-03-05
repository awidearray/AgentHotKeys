"use client";

export default function SuccessContent({ sessionId }: { sessionId: string }) {
  return (
    <main className="min-h-screen flex items-center justify-center pt-16">
      <div className="max-w-[500px] mx-auto px-6">
        <div className="bg-bg-card border-2 border-accent rounded-2xl p-12 text-center relative overflow-hidden">
          <div className="radial-glow absolute -top-24 left-1/2 -translate-x-1/2 w-[400px] h-[400px]" />
          <div className="relative z-10">
            <div className="text-5xl mb-4">&#10003;</div>
            <h1 className="text-[28px] font-extrabold mb-3 text-text-primary">
              You&apos;re In.
            </h1>
            <p className="text-text-dim mb-8">
              Your Agentic Command Keys guide is ready. Click below to download
              your PDF.
            </p>
            <a
              href={`/api/download?session_id=${sessionId}`}
              className="inline-block bg-accent text-bg px-9 py-4 rounded-xl font-bold text-base no-underline hover:bg-accent-bright hover:-translate-y-0.5 transition-all duration-300 mb-4"
            >
              Download Your PDF
            </a>
            <p className="text-text-dim text-[13px] mt-4">
              A copy has also been sent to your email. Welcome to the team.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
