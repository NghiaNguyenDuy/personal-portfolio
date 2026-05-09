import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const DEFAULT_TIMEOUT_MS = 120_000;
const PLACEHOLDER_PATTERN = /^(?:1234567890|replace-with-|change-this-|local-)/i;
const LOCAL_HOST_PATTERN = /^(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])$/i;

const args = parseArgs(process.argv.slice(2));
const fileEnv = loadProjectEnv();

function parseArgs(values) {
  const parsed = {
    target: undefined,
    checkConfig: false,
    allowLocal: false,
    forceProdSecret: false
  };

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];

    if (value === "--check-config") {
      parsed.checkConfig = true;
      continue;
    }

    if (value === "--allow-local") {
      parsed.allowLocal = true;
      continue;
    }

    if (value === "--force-prod-secret") {
      parsed.forceProdSecret = true;
      continue;
    }

    if (value === "--target") {
      parsed.target = values[index + 1];
      index += 1;
      continue;
    }

    if (value.startsWith("--target=")) {
      parsed.target = value.slice("--target=".length);
      continue;
    }

    throw new Error(`Unknown argument: ${value}`);
  }

  return parsed;
}

function loadProjectEnv() {
  const candidates = [".env.local", ".env", ".env.production"];
  const loaded = {};

  for (const candidate of candidates) {
    const filePath = resolve(process.cwd(), candidate);
    if (!existsSync(filePath)) {
      continue;
    }

    const file = readFileSync(filePath, "utf8");
    for (const line of file.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!match) {
        continue;
      }

      const [, key, rawValue] = match;
      if (loaded[key] !== undefined || process.env[key] !== undefined) {
        continue;
      }

      loaded[key] = unquote(rawValue.trim());
    }
  }

  return loaded;
}

function unquote(value) {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  return value;
}

function readConfig(name) {
  return process.env[name] ?? fileEnv[name];
}

function resolveTargetUrl() {
  const configured =
    args.target ??
    readConfig("NEWS_WORKFLOW_BASE_URL") ??
    readConfig("AUTOMATION_TARGET_URL") ??
    readConfig("NEXT_PUBLIC_APP_URL") ??
    (readConfig("VERCEL_URL") ? `https://${readConfig("VERCEL_URL")}` : undefined);

  if (!configured) {
    throw new Error("Missing target URL. Set AUTOMATION_TARGET_URL or pass --target https://your-app.vercel.app.");
  }

  let url;
  try {
    url = new URL(configured);
  } catch {
    throw new Error("Invalid target URL. Use an absolute https:// URL.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Target URL must use http or https.");
  }

  if (url.protocol !== "https:" && !args.allowLocal) {
    throw new Error("Remote automation requires https. Use --allow-local only for local testing.");
  }

  if (LOCAL_HOST_PATTERN.test(url.hostname) && !args.allowLocal) {
    throw new Error("Refusing to run against localhost. Pass --target with the production URL, or use --allow-local for local testing.");
  }

  return url.origin;
}

function resolveToken() {
  const token = readConfig("NEWS_WORKFLOW_TOKEN")?.trim();

  if (!token) {
    throw new Error("Missing NEWS_WORKFLOW_TOKEN. Store it in the automation environment or a local ignored .env file.");
  }

  if (PLACEHOLDER_PATTERN.test(token) && !args.forceProdSecret) {
    throw new Error("NEWS_WORKFLOW_TOKEN still looks like a placeholder. Use the same rotated value configured on Vercel.");
  }

  return token;
}

function summarizeResult(status, payload) {
  const imports = Array.isArray(payload.imports) ? payload.imports : [];
  const summaries = Array.isArray(payload.summaries) ? payload.summaries : [];
  const importedCount = imports.reduce((total, item) => total + Number(item.importedCount ?? 0), 0);
  const checkedCount = imports.reduce((total, item) => total + Number(item.checkedCount ?? 0), 0);
  const failedSources = imports
    .filter((item) => item?.ok === false)
    .map((item) => ({
      source: item.sourceName,
      message: item.error ?? "Unable to import source."
    }));
  const failedTopics = summaries.filter((summary) => summary?.ok === false).map((summary) => summary.topic);

  return {
    status,
    ok: payload.ok === true,
    message: payload.message ?? "",
    imports: {
      sourceCount: imports.length,
      checkedCount,
      importedCount,
      failedSources
    },
    topicSlugs: Array.isArray(payload.topicSlugs) ? payload.topicSlugs : [],
    summaries: summaries.map((summary) => ({
      topic: summary.topic,
      ok: summary.ok === true,
      summaryId: summary.summaryId ?? null,
      message: summary.message ?? ""
    })),
    failedTopics
  };
}

async function postWorkflow(targetUrl, token) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const endpoint = `${targetUrl}/api/admin/news-workflow`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        trigger: "codex-automation"
      }),
      signal: controller.signal
    });

    const text = await response.text();
    let payload;
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = {
        ok: false,
        message: text.slice(0, 500)
      };
    }

    const summary = summarizeResult(response.status, payload);
    console.log(JSON.stringify(summary, null, 2));

    if (!response.ok || payload.ok !== true) {
      process.exitCode = 1;
    }
  } finally {
    clearTimeout(timeout);
  }
}

try {
  const targetUrl = resolveTargetUrl();
  const token = resolveToken();

  if (args.checkConfig) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          targetUrl,
          tokenConfigured: true
        },
        null,
        2
      )
    );
  } else {
    await postWorkflow(targetUrl, token);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "Unknown news workflow automation error.");
  process.exitCode = 1;
}
