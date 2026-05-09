import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { refreshContentPipeline } from "@/lib/services/news";
import { getNewsWorkflowContext, savePreparedNewsSummaries } from "@/lib/services/prepared-news";

function getBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization");
  const prefix = "Bearer ";

  if (!header?.startsWith(prefix)) {
    return null;
  }

  return header.slice(prefix.length).trim();
}

function revalidateNewsWorkflowPaths(topicSlugs: string[]) {
  revalidatePath("/");
  revalidatePath("/news");
  revalidatePath("/admin");
  revalidatePath("/admin/content");

  for (const topicSlug of topicSlugs) {
    revalidatePath(`/news/${topicSlug}`);
  }
}

function authorizeNewsWorkflowRequest(request: NextRequest) {
  const expectedToken = process.env.NEWS_WORKFLOW_TOKEN;

  if (!expectedToken) {
    return {
      ok: false as const,
      response: NextResponse.json(
      { ok: false, message: "NEWS_WORKFLOW_TOKEN is not configured." },
      { status: 503 }
      )
    };
  }

  if (getBearerToken(request) !== expectedToken) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })
    };
  }

  return { ok: true as const };
}

function isPreparedSummaryPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const body = payload as Record<string, unknown>;
  return body.mode === "prepared" || Array.isArray(body.summaries) || Array.isArray(body.preparedSummaries);
}

export async function GET(request: NextRequest) {
  const authorization = authorizeNewsWorkflowRequest(request);
  if (!authorization.ok) {
    return authorization.response;
  }

  try {
    const context = await getNewsWorkflowContext();
    return NextResponse.json(context);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Unknown news workflow context error."
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authorization = authorizeNewsWorkflowRequest(request);
  if (!authorization.ok) {
    return authorization.response;
  }

  try {
    const payload = await request.json().catch(() => ({}));

    if (isPreparedSummaryPayload(payload)) {
      const result = await savePreparedNewsSummaries(payload);
      revalidateNewsWorkflowPaths(result.topicSlugs);

      return NextResponse.json(result, { status: result.ok ? 200 : 207 });
    }

    const result = await refreshContentPipeline();
    revalidateNewsWorkflowPaths(result.topicSlugs);

    return NextResponse.json(result, { status: result.ok ? 200 : 207 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Unknown news workflow error."
      },
      { status: 500 }
    );
  }
}
