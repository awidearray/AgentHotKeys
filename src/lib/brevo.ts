/**
 * Brevo event firing for automations.
 * Fire events from the app; create automations in Brevo UI triggered by these events.
 */

export type BrevoEventName =
  | "newsletter_signup"
  | "newsletter_confirmed"
  | "purchase_completed"
  | "download_accessed"
  | "cart_abandoned"
  | "guide_opened"
  | "page_visited"
  | "form_submitted"
  | "link_clicked"
  | "milestone_7_days"
  | "milestone_30_days"
  | "re_engagement_eligible"
  | "win_back_trigger"
  | "upsell_shown"
  | "feedback_request"
  | "referral_signup"
  | "trial_started"
  | "trial_ending"
  | "lead_magnet_claimed"
  | "webinar_registered";

export interface BrevoEventProperties {
  [key: string]: string | number | boolean | undefined;
}

export async function sendNewsletterConfirmationEmail(email: string): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey || apiKey.startsWith("xkeysib-REPLACE")) return false;

  const senderEmail = process.env.BREVO_SENDER_EMAIL || "hello@hotkeys.ai";
  const senderName = process.env.BREVO_SENDER_NAME || "HotKeys.ai";
  const siteUrl = process.env.SITE_URL || "https://hotkeys.ai";

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [{ email }],
        subject: "You're in — HotKeys newsletter confirmed",
        htmlContent: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; color: #111827;">
            <h1 style="font-size: 24px; margin: 0 0 12px 0;">Welcome to the HotKeys newsletter</h1>
            <p style="font-size: 16px; line-height: 1.7; color: #4B5563; margin: 0 0 18px 0;">
              Subscription confirmed. You'll get weekly insights on shipping real software with AI agents.
            </p>
            <p style="font-size: 16px; line-height: 1.7; color: #4B5563; margin: 0 0 24px 0;">
              If this wasn't you, you can safely ignore this message.
            </p>
            <a href="${siteUrl}" style="display: inline-block; background: #00E5A0; color: #05070C; text-decoration: none; font-weight: 700; padding: 12px 22px; border-radius: 10px;">
              Open HotKeys.ai
            </a>
            <p style="font-size: 12px; color: #9CA3AF; margin-top: 28px;">
              Sent by ${senderName}
            </p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      console.error("Brevo newsletter confirmation email failed:", res.status, await res.text());
      return false;
    }

    return true;
  } catch (err) {
    console.error("Brevo newsletter confirmation email error:", err);
    return false;
  }
}

export async function fireBrevoEvent(
  email: string,
  eventName: BrevoEventName,
  eventProperties?: BrevoEventProperties
): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey || apiKey.startsWith("xkeysib-REPLACE")) return;

  try {
    const res = await fetch("https://api.brevo.com/v3/events", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        event_name: eventName,
        identifiers: { email_id: email },
        ...(eventProperties && Object.keys(eventProperties).length > 0
          ? { event_properties: eventProperties }
          : {}),
      }),
    });
    if (!res.ok) {
      console.warn(`Brevo event ${eventName} failed:`, res.status);
    }
  } catch (err) {
    console.warn("Brevo event error:", err);
  }
}
