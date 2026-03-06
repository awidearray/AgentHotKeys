# Brevo Automations Guide

Events are fired from the app. Create automations in **Brevo → Marketing Automation → Create** using these triggers and templates.

## Events Fired by the App

| Event | When | Properties |
|-------|------|------------|
| `newsletter_signup` | User subscribes to newsletter | — |
| `purchase_completed` | Stripe checkout completed | `product`, `amount`, `currency` |
| `download_accessed` | User downloads PDF after purchase | — |

## Templates (push with `npm run brevo:setup`)

- `newsletter-welcome` — Welcome new subscribers
- `newsletter-confirmation` — Double opt-in
- `download-ready` — PDF download link
- `purchase-receipt` — Purchase confirmation
- `weekly-digest-intro` — params: `headline`, `intro_text`
- `re-engagement` — Win back inactive readers
- `day-1-follow-up` — 1 day after signup
- `day-3-deep-dive` — 3 days after signup
- `day-7-milestone` — params: `guide_url`
- `day-30-milestone` — params: `guide_url`
- `post-purchase-thank-you`
- `post-purchase-tip-1`
- `post-purchase-tip-2`
- `cart-abandoned` — params: `checkout_url`
- `win-back` — params: `resubscribe_url`
- `feedback-request`
- `referral-invite` — params: `referral_url`
- `lead-magnet-delivery` — params: `resource_name`, `download_url`
- `birthday-greeting` — params: `checkout_url`
- `anniversary-subscriber`
- `inactive-7-days`
- `inactive-30-days`
- `upsell-guide` — params: `checkout_url`
- `weekly-best-of` — params: `topic`, `headline`, `summary`, `link`
- `holiday-greeting`

## Automation Blueprints

Run `npm run brevo:blueprint` for the full list. Summary:

### 1. Newsletter Welcome
- **Trigger:** Event `newsletter_signup` or Contact added to list
- **Action:** Send template `newsletter-welcome`

### 2. Day 1 Follow-up
- **Trigger:** Event `newsletter_signup`
- **Steps:** Wait 1 day → Send `day-1-follow-up`

### 3. Day 3 Deep Dive
- **Trigger:** Event `newsletter_signup`
- **Steps:** Wait 3 days → Send `day-3-deep-dive`

### 4. 7-Day Milestone
- **Trigger:** Event `milestone_7_days` or date (7 days after list add)
- **Action:** Send `day-7-milestone` (param: `guide_url`)

### 5. 30-Day Milestone
- **Trigger:** Event `milestone_30_days` or date
- **Action:** Send `day-30-milestone`

### 6. Purchase Thank You
- **Trigger:** Event `purchase_completed`
- **Action:** Send `post-purchase-thank-you`

### 7. Post-Purchase Tip 1
- **Trigger:** Event `purchase_completed`
- **Steps:** Wait 2 days → Send `post-purchase-tip-1`

### 8. Post-Purchase Tip 2
- **Trigger:** Event `purchase_completed`
- **Steps:** Wait 5 days → Send `post-purchase-tip-2`

### 9. Cart Abandoned
- **Trigger:** Event `cart_abandoned` (fire from your cart logic)
- **Steps:** Wait 1 hour → Send `cart-abandoned` (param: `checkout_url`)

### 10. Re-engagement
- **Trigger:** Contact has NOT opened last 3 campaigns
- **Steps:** Wait 7 days → Send `re-engagement`

### 11. Win-back
- **Trigger:** Event `win_back_trigger` or contact re-added to list
- **Action:** Send `win-back` (param: `resubscribe_url`)

### 12. Feedback Request
- **Trigger:** Event `feedback_request` or 30 days after purchase
- **Action:** Send `feedback-request`

### 13. Referral Invite
- **Trigger:** Event `referral_signup` or 14 days after purchase
- **Action:** Send `referral-invite` (param: `referral_url`)

### 14. Inactive 7 Days
- **Trigger:** Contact has NOT opened last 2 campaigns
- **Steps:** Wait 7 days → Send `inactive-7-days`

### 15. Inactive 30 Days
- **Trigger:** Contact has NOT opened last 5 campaigns
- **Steps:** Wait 14 days → Send `inactive-30-days`

### 16. Upsell Guide
- **Trigger:** Event `upsell_shown` or 14 days after signup (segment: NOT purchased)
- **Action:** Send `upsell-guide` (param: `checkout_url`)

### 17. Lead Magnet Delivery
- **Trigger:** Event `lead_magnet_claimed`
- **Action:** Send `lead-magnet-delivery` (params: `resource_name`, `download_url`)

### 18. Birthday Greeting
- **Trigger:** Date — Contact attribute `BIRTHDAY` = today
- **Action:** Send `birthday-greeting` (param: `checkout_url`)

### 19. Anniversary Subscriber
- **Trigger:** Date — 1 year after contact added to list
- **Action:** Send `anniversary-subscriber`

### 20. Holiday Greeting
- **Trigger:** Date — e.g. December 24
- **Action:** Send `holiday-greeting`

---

## How to add more events

Fire events from anywhere in the app:

```ts
import { fireBrevoEvent } from "@/lib/brevo";

await fireBrevoEvent(email, "cart_abandoned", { checkout_url: "https://..." });
await fireBrevoEvent(email, "feedback_request");
```

Available event names: `newsletter_signup`, `newsletter_confirmed`, `purchase_completed`, `download_accessed`, `cart_abandoned`, `guide_opened`, `page_visited`, `form_submitted`, `link_clicked`, `milestone_7_days`, `milestone_30_days`, `re_engagement_eligible`, `win_back_trigger`, `upsell_shown`, `feedback_request`, `referral_signup`, `trial_started`, `trial_ending`, `lead_magnet_claimed`, `webinar_registered`.
