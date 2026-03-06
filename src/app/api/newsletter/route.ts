import { NextRequest, NextResponse } from "next/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function addContactToList(
  brevoApiKey: string,
  listId: number,
  email: string
): Promise<{ ok: boolean; status: number; body: string }> {
  const res = await fetch(
    `https://api.brevo.com/v3/contacts/lists/${listId}/contacts/add`,
    {
      method: "POST",
      headers: {
        "api-key": brevoApiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ emails: [email] }),
    }
  );
  const body = await res.text();
  return { ok: res.ok, status: res.status, body };
}

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
  const listIdRaw = process.env.BREVO_LIST_ID;
  const listId = listIdRaw ? parseInt(listIdRaw, 10) : null;

  if (!brevoApiKey || brevoApiKey.startsWith("xkeysib-REPLACE")) {
    console.log("Newsletter signup (Brevo not configured):", email);
    return NextResponse.json({ success: true });
  }

  try {
    // 1. Create or update contact
    const createRes = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "api-key": brevoApiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email,
        updateEnabled: true,
        ...(listId && listId > 0 ? { listIds: [listId] } : {}),
      }),
    });

    const createBody = await createRes.text();

    if (createRes.ok) {
      return NextResponse.json({ success: true });
    }

    // 2. 409 = contact already exists — add to list if we have one, else still success
    if (createRes.status === 409) {
      if (listId && listId > 0) {
        const addRes = await addContactToList(brevoApiKey, listId, email);
        if (addRes.ok) {
          return NextResponse.json({ success: true });
        }
        console.error(
          "Brevo add-to-list failed after 409:",
          addRes.status,
          addRes.body
        );
      } else {
        // Contact exists, no list — treat as success
        return NextResponse.json({ success: true });
      }
    } else {
      console.error(
        "Brevo create contact error:",
        createRes.status,
        createBody
      );
    }
  } catch (err) {
    console.error("Brevo API error:", err);
  }

  return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
}
