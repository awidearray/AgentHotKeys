import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center pt-16">
      <div className="text-center px-6">
        <h1 className="text-6xl font-black gradient-text mb-4">404</h1>
        <p className="text-text-dim text-lg mb-8">Page not found.</p>
        <Button variant="primary" href="/">
          Back to Home
        </Button>
      </div>
    </main>
  );
}
