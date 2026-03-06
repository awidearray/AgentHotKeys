#!/usr/bin/env npx ts-node
/**
 * Brevo setup script: creates list, templates, and documents automation events.
 * Loads BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME from .env.local
 *
 * Run: npx dotenv -e .env.local -- npx ts-node scripts/brevo-setup.ts
 * Or:  npm run brevo:setup (add to package.json)
 */

import * as dotenv from "dotenv";
import * as path from "path";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || "hello@hotkeys.ai";
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || "HotKeys.ai";

if (!BREVO_API_KEY || BREVO_API_KEY.startsWith("xkeysib-REPLACE")) {
  console.error("Set BREVO_API_KEY in .env.local");
  process.exit(1);
}

const headers = {
  "api-key": BREVO_API_KEY,
  "Content-Type": "application/json",
  Accept: "application/json",
};

async function brevoFetch(url: string, options: RequestInit = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { ...headers, ...(options.headers as object) },
  });
  return res;
}

// --- Lists ---
async function getLists() {
  const res = await brevoFetch("https://api.brevo.com/v3/contacts/lists?limit=50");
  if (!res.ok) throw new Error(`Lists: ${res.status} ${await res.text()}`);
  return res.json();
}

async function getFolders() {
  const res = await brevoFetch("https://api.brevo.com/v3/contacts/folders?limit=20");
  if (!res.ok) throw new Error(`Folders: ${res.status} ${await res.text()}`);
  return res.json();
}

async function createList(name: string, folderId: number) {
  const res = await brevoFetch("https://api.brevo.com/v3/contacts/lists", {
    method: "POST",
    body: JSON.stringify({ name, folderId }),
  });
  if (!res.ok) throw new Error(`Create list: ${res.status} ${await res.text()}`);
  return res.json();
}

async function ensureList(name: string, matchNames: string[]): Promise<number> {
  const { lists } = await getLists();
  const existing = lists?.find((l: { name: string }) =>
    matchNames.some((m) => l.name.toLowerCase().includes(m.toLowerCase()))
  );
  if (existing) {
    console.log(`Using existing list: ${existing.name} (ID: ${existing.id})`);
    return existing.id;
  }

  let folderId = 0;
  try {
    const { folders } = await getFolders();
    if (folders?.length) folderId = folders[0].id;
  } catch {
    // use 0
  }

  const created = await createList(name, folderId);
  console.log(`Created list: ${name} (ID: ${created.id})`);
  return created.id;
}

async function ensureNewsletterList(): Promise<number> {
  return ensureList("HotKeys Newsletter", ["newsletter", "hotkeys"]);
}

async function ensurePurchasersList(): Promise<number> {
  return ensureList("HotKeys Purchasers", ["purchaser", "buyer", "customer"]);
}

// --- Templates ---
const baseHtml = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #333;">
  {{CONTENT}}
  <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
  <p style="font-size: 12px; color: #999;">
    &copy; 2026 Logan Golema / AlphaTON Capital
  </p>
</div>
`;

const TEMPLATES: Array<{
  name: string;
  subject: string;
  htmlContent: string;
}> = [
  {
    name: "newsletter-welcome",
    subject: "You're in — Welcome to The HotKeys Newsletter",
    htmlContent: baseHtml.replace(
      "{{CONTENT}}",
      `<h1 style="font-size: 24px; margin-bottom: 16px;">You're in. Welcome.</h1>
      <p style="font-size: 16px; line-height: 1.6; color: #666;">Every week I'll send you strategies, workflows, and hard-won lessons on building real software with AI agents. No fluff — just what works.</p>
      <p style="font-size: 14px; color: #999; line-height: 1.6;">If this wasn't you, you can ignore this email.</p>`
    ),
  },
  {
    name: "newsletter-confirmation",
    subject: "Confirm your HotKeys newsletter subscription",
    htmlContent: baseHtml.replace(
      "{{CONTENT}}",
      `<h1 style="font-size: 24px; margin-bottom: 16px;">One more step</h1>
      <p style="font-size: 16px; line-height: 1.6; color: #666;">Click the link below to confirm your subscription to The HotKeys Newsletter.</p>
      <div style="margin: 32px 0;"><a href="{{ params.confirm_url }}" style="display: inline-block; background: #00E5A0; color: #06060B; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 16px; text-decoration: none;">Confirm subscription</a></div>
      <p style="font-size: 14px; color: #999;">If you didn't sign up, you can ignore this email.</p>`
    ),
  },
  {
    name: "download-ready",
    subject: "Your HotKeys — Download Ready",
    htmlContent: baseHtml.replace(
      "{{CONTENT}}",
      `<h1 style="font-size: 24px; margin-bottom: 16px;">You're in. Welcome to the team.</h1>
      <p style="font-size: 16px; line-height: 1.6; color: #666;">Your Agentic Command Keys guide is ready. Click the button below to download your 17-page PDF.</p>
      <div style="margin: 32px 0;"><a href="{{ params.download_url }}" style="display: inline-block; background: #00E5A0; color: #06060B; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 16px; text-decoration: none;">Download Your PDF</a></div>
      <p style="font-size: 14px; color: #999;">This download link is tied to your purchase and can be used anytime.</p>`
    ),
  },
  {
    name: "purchase-receipt",
    subject: "Your HotKeys purchase receipt",
    htmlContent: baseHtml.replace(
      "{{CONTENT}}",
      `<h1 style="font-size: 24px; margin-bottom: 16px;">Thank you for your purchase</h1>
      <p style="font-size: 16px; line-height: 1.6; color: #666;">You've purchased the Agentic Command Keys guide. Your download link is below.</p>
      <div style="margin: 32px 0;"><a href="{{ params.download_url }}" style="display: inline-block; background: #00E5A0; color: #06060B; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 16px; text-decoration: none;">Get your PDF</a></div>`
    ),
  },
  {
    name: "weekly-digest-intro",
    subject: "This week in HotKeys",
    htmlContent: baseHtml.replace(
      "{{CONTENT}}",
      `<h1 style="font-size: 24px; margin-bottom: 16px;">{{ params.headline }}</h1>
      <p style="font-size: 16px; line-height: 1.6; color: #666;">{{ params.intro_text }}</p>
      <p style="font-size: 14px; color: #999;">Read the full post on the site.</p>`
    ),
  },
  {
    name: "re-engagement",
    subject: "We miss you — here's a quick win",
    htmlContent: baseHtml.replace(
      "{{CONTENT}}",
      `<h1 style="font-size: 24px; margin-bottom: 16px;">It's been a while</h1>
      <p style="font-size: 16px; line-height: 1.6; color: #666;">You haven't opened our last few emails. Here's one strategy that might help: try pairing a single AI agent with a clear output spec instead of chaining multiple agents.</p>
      <p style="font-size: 14px; color: #999;"><a href="{{ params.unsubscribe_url }}">Unsubscribe</a> anytime.</p>`
    ),
  },
  // --- Additional automation templates ---
  {
    name: "day-1-follow-up",
    subject: "Your first HotKeys tip",
    htmlContent: baseHtml.replace(
      "{{CONTENT}}",
      `<h1 style="font-size: 24px; margin-bottom: 16px;">One tip to try today</h1>
      <p style="font-size: 16px; line-height: 1.6; color: #666;">Start with the simplest workflow: one prompt, one output. Don't chain agents until you've nailed the first step.</p>
      <p style="font-size: 14px; color: #999;">More tomorrow.</p>`
    ),
  },
  {
    name: "day-3-deep-dive",
    subject: "The agent loop most people miss",
    htmlContent: baseHtml.replace(
      "{{CONTENT}}",
      `<h1 style="font-size: 24px; margin-bottom: 16px;">Feedback loops matter</h1>
      <p style="font-size: 16px; line-height: 1.6; color: #666;">The best agentic workflows include a human-in-the-loop checkpoint. Add one validation step before handing off to the next agent.</p>
      <p style="font-size: 14px; color: #999;">See you next week.</p>`
    ),
  },
  {
    name: "day-7-milestone",
    subject: "7 days in — how's it going?",
    htmlContent: baseHtml.replace(
      "{{CONTENT}}",
      `<h1 style="font-size: 24px; margin-bottom: 16px;">You've been in for a week</h1>
      <p style="font-size: 16px; line-height: 1.6; color: #666;">What's working? What's not? Reply to this email — I read every response.</p>
      <p style="font-size: 14px; color: #999;">Meanwhile: have you tried the Agentic Command Keys guide?</p>
      <div style="margin: 24px 0;"><a href="{{ params.guide_url }}" style="display: inline-block; background: #00E5A0; color: #06060B; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; text-decoration: none;">Get the guide</a></div>`
    ),
  },
  {
    name: "day-30-milestone",
    subject: "30 days — you're in the top 10%",
    htmlContent: baseHtml.replace(
      "{{CONTENT}}",
      `<h1 style="font-size: 24px; margin-bottom: 16px;">You've stuck with it</h1>
      <p style="font-size: 16px; line-height: 1.6; color: #666;">Most people give up after a few emails. You're still here. That says something.</p>
      <p style="font-size: 16px; line-height: 1.6; color: #666;">Want to go deeper? The guide has 17 pages of strategies I use every day.</p>
      <div style="margin: 24px 0;"><a href="{{ params.guide_url }}" style="display: inline-block; background: #00E5A0; color: #06060B; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; text-decoration: none;">Get the guide</a></div>`
    ),
  },
  {
    name: "post-purchase-thank-you",
    subject: "Thanks for joining the team",
    htmlContent: baseHtml.replace(
      "{{CONTENT}}",
      `<h1 style="font-size: 24px; margin-bottom: 16px;">You're in.</h1>
      <p style="font-size: 16px; line-height: 1.6; color: #666;">Your purchase supports this newsletter and keeps it ad-free. You now have the full Agentic Command Keys guide.</p>
      <p style="font-size: 14px; color: #999;">Questions? Just reply.</p>`
    ),
  },
  {
    name: "post-purchase-tip-1",
    subject: "Tip: Start with the keyboard shortcuts",
    htmlContent: baseHtml.replace(
      "{{CONTENT}}",
      `<h1 style="font-size: 24px; margin-bottom: 16px;">Pro tip from the guide</h1>
      <p style="font-size: 16px; line-height: 1.6; color: #666;">Page 3 — the keyboard shortcuts. Master those first. They'll 10x your workflow before you touch any agents.</p>
      <p style="font-size: 14px; color: #999;">More tips next week.</p>`
    ),
  },
  {
    name: "post-purchase-tip-2",
    subject: "The 3-2-1 prompt structure",
    htmlContent: baseHtml.replace(
      "{{CONTENT}}",
      `<h1 style="font-size: 24px; margin-bottom: 16px;">Better prompts in 5 minutes</h1>
      <p style="font-size: 16px; line-height: 1.6; color: #666;">From the guide: 3 parts context, 2 parts task, 1 part format. Try it on your next prompt.</p>
      <p style="font-size: 14px; color: #999;">— Logan</p>`
    ),
  },
  {
    name: "cart-abandoned",
    subject: "You left something behind",
    htmlContent: baseHtml.replace(
      "{{CONTENT}}",
      `<h1 style="font-size: 24px; margin-bottom: 16px;">Still thinking about it?</h1>
      <p style="font-size: 16px; line-height: 1.6; color: #666;">The Agentic Command Keys guide is waiting. 17 pages of strategies that work with Claude, GPT, Copilot, and any AI agent.</p>
      <div style="margin: 24px 0;"><a href="{{ params.checkout_url }}" style="display: inline-block; background: #00E5A0; color: #06060B; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; text-decoration: none;">Complete your purchase</a></div>`
    ),
  },
  {
    name: "win-back",
    subject: "Come back — we've got new stuff",
    htmlContent: baseHtml.replace(
      "{{CONTENT}}",
      `<h1 style="font-size: 24px; margin-bottom: 16px;">We've added new strategies</h1>
      <p style="font-size: 16px; line-height: 1.6; color: #666;">The newsletter has evolved. New workflows, new prompts, new lessons from the trenches.</p>
      <p style="font-size: 14px; color: #999;">One click to resubscribe: <a href="{{ params.resubscribe_url }}">I'm back in</a></p>`
    ),
  },
  {
    name: "feedback-request",
    subject: "Quick question — 30 seconds",
    htmlContent: baseHtml.replace(
      "{{CONTENT}}",
      `<h1 style="font-size: 24px; margin-bottom: 16px;">What's most valuable to you?</h1>
      <p style="font-size: 16px; line-height: 1.6; color: #666;">Reply with one word: workflows, prompts, strategy, or other. It helps me write better content.</p>
      <p style="font-size: 14px; color: #999;">Thanks — Logan</p>`
    ),
  },
  {
    name: "referral-invite",
    subject: "Share HotKeys with a colleague",
    htmlContent: baseHtml.replace(
      "{{CONTENT}}",
      `<h1 style="font-size: 24px; margin-bottom: 16px;">Know someone who'd benefit?</h1>
      <p style="font-size: 16px; line-height: 1.6; color: #666;">Forward this or share your link: {{ params.referral_url }}</p>
      <p style="font-size: 14px; color: #999;">No incentives — just good content.</p>`
    ),
  },
  {
    name: "lead-magnet-delivery",
    subject: "Your free resource is ready",
    htmlContent: baseHtml.replace(
      "{{CONTENT}}",
      `<h1 style="font-size: 24px; margin-bottom: 16px;">Here's what you asked for</h1>
      <p style="font-size: 16px; line-height: 1.6; color: #666;">Click below to get {{ params.resource_name }}.</p>
      <div style="margin: 24px 0;"><a href="{{ params.download_url }}" style="display: inline-block; background: #00E5A0; color: #06060B; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; text-decoration: none;">Download</a></div>`
    ),
  },
  {
    name: "birthday-greeting",
    subject: "Happy birthday from HotKeys",
    htmlContent: baseHtml.replace(
      "{{CONTENT}}",
      `<h1 style="font-size: 24px; margin-bottom: 16px;">Happy birthday!</h1>
      <p style="font-size: 16px; line-height: 1.6; color: #666;">Here's a gift: use code BDAY20 for 20% off the Agentic Command Keys guide today.</p>
      <div style="margin: 24px 0;"><a href="{{ params.checkout_url }}" style="display: inline-block; background: #00E5A0; color: #06060B; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; text-decoration: none;">Claim discount</a></div>`
    ),
  },
  {
    name: "anniversary-subscriber",
    subject: "1 year with HotKeys",
    htmlContent: baseHtml.replace(
      "{{CONTENT}}",
      `<h1 style="font-size: 24px; margin-bottom: 16px;">You've been here a year</h1>
      <p style="font-size: 16px; line-height: 1.6; color: #666;">Thanks for sticking around. As a thank-you: reply with "anniversary" and I'll send you an exclusive workflow doc.</p>
      <p style="font-size: 14px; color: #999;">— Logan</p>`
    ),
  },
  {
    name: "inactive-7-days",
    subject: "Haven't heard from you",
    htmlContent: baseHtml.replace(
      "{{CONTENT}}",
      `<h1 style="font-size: 24px; margin-bottom: 16px;">We noticed you've been quiet</h1>
      <p style="font-size: 16px; line-height: 1.6; color: #666;">No pressure — but here's one quick win: the "describe then do" pattern. Tell the agent what you want in plain English, then let it execute. Works every time.</p>
      <p style="font-size: 14px; color: #999;"><a href="{{ params.unsubscribe_url }}">Unsubscribe</a></p>`
    ),
  },
  {
    name: "inactive-30-days",
    subject: "Last chance — or just say hi",
    htmlContent: baseHtml.replace(
      "{{CONTENT}}",
      `<h1 style="font-size: 24px; margin-bottom: 16px;">It's been a month</h1>
      <p style="font-size: 16px; line-height: 1.6; color: #666;">We'll keep you on the list for now. If you want to stay, just click a link in the next email. If not, we'll miss you.</p>
      <p style="font-size: 14px; color: #999;"><a href="{{ params.unsubscribe_url }}">Unsubscribe now</a></p>`
    ),
  },
  {
    name: "upsell-guide",
    subject: "You're getting the newsletter — want the full guide?",
    htmlContent: baseHtml.replace(
      "{{CONTENT}}",
      `<h1 style="font-size: 24px; margin-bottom: 16px;">The newsletter is free. The guide is not.</h1>
      <p style="font-size: 16px; line-height: 1.6; color: #666;">17 pages. $35. Strategies I use daily. If you've been enjoying the tips, the guide goes deeper.</p>
      <div style="margin: 24px 0;"><a href="{{ params.checkout_url }}" style="display: inline-block; background: #00E5A0; color: #06060B; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; text-decoration: none;">Get the guide</a></div>`
    ),
  },
  {
    name: "weekly-best-of",
    subject: "This week's best: {{ params.topic }}",
    htmlContent: baseHtml.replace(
      "{{CONTENT}}",
      `<h1 style="font-size: 24px; margin-bottom: 16px;">{{ params.headline }}</h1>
      <p style="font-size: 16px; line-height: 1.6; color: #666;">{{ params.summary }}</p>
      <div style="margin: 24px 0;"><a href="{{ params.link }}" style="display: inline-block; background: #00E5A0; color: #06060B; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; text-decoration: none;">Read more</a></div>`
    ),
  },
  {
    name: "holiday-greeting",
    subject: "Happy holidays from HotKeys",
    htmlContent: baseHtml.replace(
      "{{CONTENT}}",
      `<h1 style="font-size: 24px; margin-bottom: 16px;">Seasons greetings</h1>
      <p style="font-size: 16px; line-height: 1.6; color: #666;">Take a break. The agents can wait. We'll be back with fresh content in the new year.</p>
      <p style="font-size: 14px; color: #999;">— Logan & HotKeys</p>`
    ),
  },
];

async function getExistingTemplates() {
  const res = await brevoFetch(
    "https://api.brevo.com/v3/smtp/templates?limit=100"
  );
  if (!res.ok) throw new Error(`Templates list: ${res.status} ${await res.text()}`);
  return res.json();
}

async function createTemplate(tpl: (typeof TEMPLATES)[0]) {
  const res = await brevoFetch("https://api.brevo.com/v3/smtp/templates", {
    method: "POST",
    body: JSON.stringify({
      sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
      templateName: tpl.name,
      subject: tpl.subject,
      htmlContent: tpl.htmlContent,
      isActive: true,
      replyTo: BREVO_SENDER_EMAIL,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    if (text.includes("duplicate") || res.status === 400) {
      console.log(`  Template "${tpl.name}" may already exist, skipping`);
      return;
    }
    throw new Error(`Create template ${tpl.name}: ${res.status} ${text}`);
  }
  console.log(`  Created template: ${tpl.name}`);
}

async function pushTemplates() {
  const existing = await getExistingTemplates();
  const names = new Set((existing.templates || []).map((t: { name: string }) => t.name));

  for (const tpl of TEMPLATES) {
    if (names.has(tpl.name)) {
      console.log(`  Template "${tpl.name}" exists, skipping`);
      continue;
    }
    await createTemplate(tpl);
  }
}

// --- Main ---
async function main() {
  console.log("Brevo setup — using .env.local\n");

  const newsletterListId = await ensureNewsletterList();
  const purchasersListId = await ensurePurchasersList();

  console.log("\n--- Add to .env.local ---");
  console.log(`BREVO_LIST_ID=${newsletterListId}`);
  console.log(`BREVO_PURCHASERS_LIST_ID=${purchasersListId}`);
  console.log("");

  console.log("Pushing templates...");
  await pushTemplates();
  console.log("Templates done.\n");

  console.log("Automation events (fired from app):");
  console.log("  newsletter_signup, purchase_completed, download_accessed");
  console.log("\nRun 'npm run brevo:blueprint' for 20+ automation definitions.");
  console.log("See BREVO_AUTOMATIONS.md for the full guide.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
