import { NextRequest, NextResponse } from "next/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email } = body;

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const brevoApiKey = process.env.BREVO_API_KEY;

  if (brevoApiKey && !brevoApiKey.startsWith("xkeysib-REPLACE")) {
    const listIdRaw = process.env.BREVO_LIST_ID;
    const listIds = listIdRaw ? [parseInt(listIdRaw, 10)] : [];

    if (listIds.length === 0) {
      console.warn("BREVO_LIST_ID not set — subscriber will be added to Brevo but no list");
    }

    try {
      const res = await fetch("https://api.brevo.com/v3/contacts", {
        method: "POST",
        headers: {
          "api-key": brevoApiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email,
          updateEnabled: true,
          ...(listIds.length > 0 && { listIds }),
        }),
      });

      if (!res.ok && res.status !== 409) {
        // 409 = contact already exists, which is fine
        console.error("Brevo API error:", res.status, await res.text());
        return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
      }
    } catch (err) {
      console.error("Brevo API error:", err);
      return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
    }
  } else {
    console.log("Newsletter signup (Brevo not configured):", email);
  }

  return NextResponse.json({ success: true });
}
