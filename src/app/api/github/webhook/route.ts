import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function verifyGitHubSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature?.startsWith("sha256=")) return false;
  const sigHex = signature.slice(7);
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload, "utf8")
    .digest("hex");
  if (sigHex.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(sigHex, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("GitHub webhook: GITHUB_WEBHOOK_SECRET not configured");
    return NextResponse.json(
      { error: "GitHub webhook not configured" },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifyGitHubSignature(body, signature, webhookSecret)) {
    console.error("GitHub webhook: invalid or missing signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: { action?: string; installation?: unknown };
  try {
    payload = JSON.parse(body) as { action?: string; installation?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = request.headers.get("x-github-event") ?? "unknown";
  const deliveryId = request.headers.get("x-github-delivery");

  // Respond immediately - GitHub expects a fast 2xx response
  // Process async if needed to avoid timeout
  const processWebhook = async () => {
    console.log(`[GitHub Webhook] ${event} ${payload.action ?? ""} delivery=${deliveryId}`);

    switch (event) {
      case "installation":
        if (payload.action === "created") {
          console.log("[GitHub Webhook] App installed", payload.installation);
          // Add: sync installation to DB, notify, etc.
        } else if (payload.action === "deleted") {
          console.log("[GitHub Webhook] App uninstalled", payload.installation);
        }
        break;
      case "installation_repositories":
        console.log("[GitHub Webhook] Repositories changed", payload);
        break;
      case "ping":
        console.log("[GitHub Webhook] Ping received - webhook configured");
        break;
      default:
        console.log(`[GitHub Webhook] Unhandled event: ${event}`);
    }
  };

  processWebhook().catch((err) =>
    console.error("[GitHub Webhook] Process error:", err)
  );

  return NextResponse.json({ received: true });
}
