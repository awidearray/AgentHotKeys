import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin, safeDbOperation } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import { rateLimiters } from "@/lib/rate-limit";
import { handleApiError, ValidationError } from "@/lib/errors";

type GitHubAccount = {
  login?: string;
  type?: string;
  html_url?: string;
};

type GitHubInstallationPayload = {
  id?: number;
  target_type?: string;
  account?: GitHubAccount;
  permissions?: Record<string, string>;
  events?: string[];
  suspended_at?: string | null;
  suspended_by?: { login?: string } | null;
};

type GitHubRepository = {
  id?: number;
  full_name?: string;
  private?: boolean;
  default_branch?: string;
};

type GitHubWebhookPayload = {
  action?: string;
  installation?: GitHubInstallationPayload;
  repositories_added?: GitHubRepository[];
  repositories_removed?: GitHubRepository[];
};

function verifyGitHubSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature?.startsWith("sha256=")) return false;
  const sigHex = signature.slice(7);
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload, "utf8")
    .digest("hex");
  if (sigHex.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(sigHex, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    await rateLimiters.webhook(request);

    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new ValidationError("GITHUB_WEBHOOK_SECRET is not configured");
    }

    const body = await request.text();
    const signature = request.headers.get("x-hub-signature-256");
    if (!verifyGitHubSignature(body, signature, webhookSecret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    let payload: GitHubWebhookPayload;
    try {
      payload = JSON.parse(body) as GitHubWebhookPayload;
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const event = request.headers.get("x-github-event") ?? "unknown";
    const deliveryId = request.headers.get("x-github-delivery");
    logger.info({
      type: "github_webhook_received",
      event,
      action: payload.action,
      deliveryId
    });

    switch (event) {
      case "ping":
        return NextResponse.json({ received: true, processed: true });
      case "installation":
        await syncInstallation(payload);
        return NextResponse.json({ received: true, processed: true });
      case "installation_repositories":
        await syncInstallationRepositories(payload);
        return NextResponse.json({ received: true, processed: true });
      default:
        logger.info({
          type: "github_webhook_ignored",
          event,
          action: payload.action,
          deliveryId
        });
        return NextResponse.json({ received: true, processed: false, reason: "event_not_handled" });
    }
  } catch (error) {
    return handleApiError(error, { endpoint: "/api/github/webhook" });
  }
}

async function syncInstallation(payload: GitHubWebhookPayload): Promise<void> {
  const installation = payload.installation;
  if (!installation?.id) {
    throw new ValidationError("Webhook payload missing installation.id");
  }

  const action = payload.action;
  const installationId = installation.id;
  const nowIso = new Date().toISOString();

  if (action === "deleted") {
    const deleteResult = await safeDbOperation(async () =>
      await supabaseAdmin
        .from("github_app_installations")
        .delete()
        .eq("installation_id", installationId)
    );

    if (!deleteResult.success) {
      throw new Error(deleteResult.error || "Failed to delete installation");
    }
    return;
  }

  const upsertResult = await safeDbOperation(async () =>
    await supabaseAdmin
      .from("github_app_installations")
      .upsert(
        {
          installation_id: installationId,
          account_login: installation.account?.login ?? null,
          account_type: installation.account?.type ?? null,
          account_html_url: installation.account?.html_url ?? null,
          target_type: installation.target_type ?? null,
          permissions: installation.permissions ?? {},
          events: installation.events ?? [],
          suspended_at: action === "suspend" ? nowIso : null,
          suspended_by: action === "suspend" ? installation.suspended_by?.login ?? null : null,
          updated_at: nowIso,
          installed_at: action === "created" ? nowIso : undefined
        },
        { onConflict: "installation_id" }
      )
  );

  if (!upsertResult.success) {
    throw new Error(upsertResult.error || "Failed to upsert installation");
  }
}

async function syncInstallationRepositories(payload: GitHubWebhookPayload): Promise<void> {
  const installationId = payload.installation?.id;
  if (!installationId) {
    throw new ValidationError("Webhook payload missing installation.id");
  }

  const repositoriesAdded = payload.repositories_added || [];
  const repositoriesRemoved = payload.repositories_removed || [];

  if (repositoriesAdded.length > 0) {
    const records = repositoriesAdded
      .filter((repo) => repo.id && repo.full_name)
      .map((repo) => ({
        installation_id: installationId,
        repository_id: repo.id as number,
        full_name: repo.full_name as string,
        is_private: Boolean(repo.private),
        default_branch: repo.default_branch ?? null,
        added_at: new Date().toISOString()
      }));

    if (records.length > 0) {
      const upsertResult = await safeDbOperation(async () =>
        await supabaseAdmin
          .from("github_installation_repositories")
          .upsert(records, { onConflict: "installation_id,repository_id" })
      );
      if (!upsertResult.success) {
        throw new Error(upsertResult.error || "Failed to sync added repositories");
      }
    }
  }

  const removedIds = repositoriesRemoved
    .map((repo) => repo.id)
    .filter((repoId): repoId is number => typeof repoId === "number");
  if (removedIds.length > 0) {
    const deleteResult = await safeDbOperation(async () =>
      await supabaseAdmin
        .from("github_installation_repositories")
        .delete()
        .eq("installation_id", installationId)
        .in("repository_id", removedIds)
    );
    if (!deleteResult.success) {
      throw new Error(deleteResult.error || "Failed to remove repositories");
    }
  }
}
