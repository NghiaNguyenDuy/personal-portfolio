import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { refreshContentPipeline } from "@/lib/services/news";

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

export async function POST(request: NextRequest) {
  const expectedToken = process.env.NEWS_WORKFLOW_TOKEN;

  if (!expectedToken) {
    return NextResponse.json(
      { ok: false, message: "NEWS_WORKFLOW_TOKEN is not configured." },
      { status: 503 }
    );
  }

  if (getBearerToken(request) !== expectedToken) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
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
