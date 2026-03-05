interface CloudflareEnv {
  ASSETS: Fetcher;
  PURCHASE_TOKENS: KVNamespace;
  PDF_BUCKET: R2Bucket;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  BREVO_API_KEY: string;
  NEXT_PUBLIC_STRIPE_PAYMENT_LINK: string;
  SITE_URL: string;
}
