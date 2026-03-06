import { NextRequest, NextResponse } from "next/server";
import { fireBrevoEvent, sendNewsletterConfirmationEmail } from "@/lib/brevo";

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

async function createOrUpdateContact(
  brevoApiKey: string,
  email: string,
  listId?: number
): Promise<{ ok: boolean; status: number; body: string }> {
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
      ...(listId && listId > 0 ? { listIds: [listId] } : {}),
    }),
  });

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

  const email = body.email?.trim().toLowerCase();

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const brevoApiKey = process.env.BREVO_API_KEY;
  const listIdRaw = process.env.BREVO_LIST_ID;
  const listId = listIdRaw ? parseInt(listIdRaw, 10) : null;

  const finalizeSuccess = async () => {
    await fireBrevoEvent(email, "newsletter_signup");
    const sent = await sendNewsletterConfirmationEmail(email);
    if (sent) {
      await fireBrevoEvent(email, "newsletter_confirmed");
    }
    return NextResponse.json({ success: true, confirmationSent: sent });
  };

  if (!brevoApiKey || brevoApiKey.startsWith("xkeysib-REPLACE")) {
    console.log("Newsletter signup (Brevo not configured):", email);
    return NextResponse.json({
      success: true,
      confirmationSent: false,
      message: "Brevo is not configured; confirmation email not sent.",
    });
  }

  try {
    // 1. Create/update contact, optionally with list assignment.
    // If list assignment fails (bad list id/config), retry without list so signup can still succeed.
    let createResult = await createOrUpdateContact(
      brevoApiKey,
      email,
      listId ?? undefined
    );

    if (!createResult.ok && listId && listId > 0) {
      console.warn(
        "Brevo create with list failed, retrying without list:",
        createResult.status,
        createResult.body
      );
      createResult = await createOrUpdateContact(brevoApiKey, email);
    }

    if (createResult.ok) return finalizeSuccess();

    // 2. 409 = contact already exists — add to list if we have one, else still success
    if (createResult.status === 409) {
      if (listId && listId > 0) {
        const addRes = await addContactToList(brevoApiKey, listId, email);
        if (addRes.ok) {
          return finalizeSuccess();
        }
        console.error(
          "Brevo add-to-list failed after 409:",
          addRes.status,
          addRes.body
        );
        // Don't block signup UX on Brevo list issues.
        return finalizeSuccess();
      } else {
        // Contact exists, no list — treat as success
        return finalizeSuccess();
      }
    } else {
      console.error(
        "Brevo create contact error:",
        createResult.status,
        createResult.body
      );
      // Don't hard-fail newsletter signup because an external provider errored.
      return finalizeSuccess();
    }
  } catch (err) {
    console.error("Brevo API error:", err);
    // Keep the endpoint user-safe even when Brevo is temporarily unavailable.
    return finalizeSuccess();
  }
}
