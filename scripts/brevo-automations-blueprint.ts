#!/usr/bin/env npx tsx
/**
 * Brevo automation blueprint: outputs automation definitions for manual setup in Brevo UI.
 * Run: npm run brevo:blueprint
 */

const AUTOMATIONS: Array<{
  name: string;
  trigger: "event" | "list" | "date" | "marketing_activity";
  triggerConfig: string;
  steps: Array<{ action: string; config: string }>;
}> = [
  {
    name: "Newsletter Welcome",
    trigger: "event",
    triggerConfig: "Event: newsletter_signup (or: Contact added to list HotKeys Newsletter)",
    steps: [
      { action: "Send transactional email", config: "Template: newsletter-welcome" },
    ],
  },
  {
    name: "Day 1 Follow-up",
    trigger: "event",
    triggerConfig: "Event: newsletter_signup",
    steps: [
      { action: "Wait", config: "1 day" },
      { action: "Send email", config: "Template: day-1-follow-up" },
    ],
  },
  {
    name: "Day 3 Deep Dive",
    trigger: "event",
    triggerConfig: "Event: newsletter_signup",
    steps: [
      { action: "Wait", config: "3 days" },
      { action: "Send email", config: "Template: day-3-deep-dive" },
    ],
  },
  {
    name: "7-Day Milestone",
    trigger: "event",
    triggerConfig: "Event: milestone_7_days (or: Date - 7 days after list add)",
    steps: [
      { action: "Send email", config: "Template: day-7-milestone, param: guide_url" },
    ],
  },
  {
    name: "30-Day Milestone",
    trigger: "event",
    triggerConfig: "Event: milestone_30_days (or: Date - 30 days after list add)",
    steps: [
      { action: "Send email", config: "Template: day-30-milestone, param: guide_url" },
    ],
  },
  {
    name: "Purchase Thank You",
    trigger: "event",
    triggerConfig: "Event: purchase_completed",
    steps: [
      { action: "Send email", config: "Template: post-purchase-thank-you" },
    ],
  },
  {
    name: "Post-Purchase Tip 1",
    trigger: "event",
    triggerConfig: "Event: purchase_completed",
    steps: [
      { action: "Wait", config: "2 days" },
      { action: "Send email", config: "Template: post-purchase-tip-1" },
    ],
  },
  {
    name: "Post-Purchase Tip 2",
    trigger: "event",
    triggerConfig: "Event: purchase_completed",
    steps: [
      { action: "Wait", config: "5 days" },
      { action: "Send email", config: "Template: post-purchase-tip-2" },
    ],
  },
  {
    name: "Cart Abandoned",
    trigger: "event",
    triggerConfig: "Event: cart_abandoned",
    steps: [
      { action: "Wait", config: "1 hour" },
      { action: "Send email", config: "Template: cart-abandoned, param: checkout_url" },
    ],
  },
  {
    name: "Re-engagement (Inactive Opens)",
    trigger: "marketing_activity",
    triggerConfig: "Contact has NOT opened last 3 campaigns",
    steps: [
      { action: "Wait", config: "7 days" },
      { action: "Send email", config: "Template: re-engagement" },
    ],
  },
  {
    name: "Win-back",
    trigger: "event",
    triggerConfig: "Event: win_back_trigger (or: Contact removed from list, then re-added)",
    steps: [
      { action: "Send email", config: "Template: win-back, param: resubscribe_url" },
    ],
  },
  {
    name: "Feedback Request",
    trigger: "event",
    triggerConfig: "Event: feedback_request (or: 30 days after purchase)",
    steps: [
      { action: "Send email", config: "Template: feedback-request" },
    ],
  },
  {
    name: "Referral Invite",
    trigger: "event",
    triggerConfig: "Event: referral_signup (or: 14 days after purchase, segment: purchased)",
    steps: [
      { action: "Send email", config: "Template: referral-invite, param: referral_url" },
    ],
  },
  {
    name: "Inactive 7 Days",
    trigger: "marketing_activity",
    triggerConfig: "Contact has NOT opened last 2 campaigns",
    steps: [
      { action: "Wait", config: "7 days" },
      { action: "Send email", config: "Template: inactive-7-days" },
    ],
  },
  {
    name: "Inactive 30 Days",
    trigger: "marketing_activity",
    triggerConfig: "Contact has NOT opened last 5 campaigns",
    steps: [
      { action: "Wait", config: "14 days" },
      { action: "Send email", config: "Template: inactive-30-days" },
    ],
  },
  {
    name: "Upsell Guide",
    trigger: "event",
    triggerConfig: "Event: upsell_shown (or: 14 days after newsletter signup, segment: NOT purchased)",
    steps: [
      { action: "Send email", config: "Template: upsell-guide, param: checkout_url" },
    ],
  },
  {
    name: "Lead Magnet Delivery",
    trigger: "event",
    triggerConfig: "Event: lead_magnet_claimed",
    steps: [
      { action: "Send email", config: "Template: lead-magnet-delivery, params: resource_name, download_url" },
    ],
  },
  {
    name: "Birthday Greeting",
    trigger: "date",
    triggerConfig: "Contact attribute: BIRTHDAY = today",
    steps: [
      { action: "Send email", config: "Template: birthday-greeting, param: checkout_url" },
    ],
  },
  {
    name: "Anniversary Subscriber",
    trigger: "date",
    triggerConfig: "1 year after contact added to list",
    steps: [
      { action: "Send email", config: "Template: anniversary-subscriber" },
    ],
  },
  {
    name: "Holiday Greeting",
    trigger: "date",
    triggerConfig: "December 24 (or customize)",
    steps: [
      { action: "Send email", config: "Template: holiday-greeting" },
    ],
  },
];

function main() {
  console.log("# Brevo Automation Blueprint\n");
  console.log("Create these automations in Brevo: Marketing Automation → Create\n");
  console.log("Events fired from the app: newsletter_signup, purchase_completed, cart_abandoned, download_accessed, milestone_7_days, milestone_30_days, feedback_request, referral_signup, upsell_shown, lead_magnet_claimed, win_back_trigger\n");

  AUTOMATIONS.forEach((a, i) => {
    console.log(`## ${i + 1}. ${a.name}`);
    console.log(`   **Trigger:** ${a.triggerConfig}`);
    a.steps.forEach((s) => console.log(`   **Step:** ${s.action} — ${s.config}`));
    console.log("");
  });

  console.log("---\nRun `npm run brevo:setup` first to push all templates to Brevo.");
}

main();
