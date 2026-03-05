import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email } = body;

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const brevoApiKey = process.env.BREVO_API_KEY;

  if (brevoApiKey && !brevoApiKey.startsWith("xkeysib-REPLACE")) {
    // Add subscriber to Brevo contact list
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
          // Add to your newsletter list — set the list ID in Brevo dashboard
          // listIds: [2],
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
    // Fallback: log to console when Brevo not configured
    console.log("Newsletter signup:", email);
  }

  return NextResponse.json({ success: true });
}
