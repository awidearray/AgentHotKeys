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
