"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  asSessionUser,
  clearUserSession,
  createUserSession,
  ensureAdminUser,
  getSessionUser,
  hashPassword,
  requireAuthenticatedUser,
  verifyPassword
} from "@/lib/auth";
import {
  commentInputSchema,
  contentSourceSchema,
  postInputSchema,
  readingArticleSchema,
  registerSchema,
  signInSchema,
  summaryGenerationSchema
} from "@/lib/content";
import { prisma } from "@/lib/prisma";
import { analyzeExternalArticle, normalizeTagLabels } from "@/lib/services/article-analysis";
import { inferSourceIdentity, importSourceById } from "@/lib/services/source-ingestion";
import { generateSummaryForFilters } from "@/lib/services/summary-generation";
import { createReaderUser, findUserByEmail } from "@/lib/store";

export interface ActionState {
  ok: boolean;
  message: string;
}

function splitCommaList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function requireAdminSession() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    throw new Error("Admin access required.");
  }

  return user;
}

export async function signInAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const payload = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? "")
  };

  const parsed = signInSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, message: "Enter a valid email and password." };
  }

  let user;
  try {
    await ensureAdminUser();
    user = await findUserByEmail(parsed.data.email);
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Unable to sign in." };
  }

  if (!user?.passwordHash || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return { ok: false, message: "Incorrect email or password." };
  }

  await createUserSession(asSessionUser(user));
  redirect(user.role === "ADMIN" ? "/admin" : "/");
}

export async function registerAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const payload = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? "")
  };

  const parsed = registerSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, message: "Enter a valid name, email, and password with at least 8 characters." };
  }

  try {
    const existing = await findUserByEmail(parsed.data.email);
    if (existing) {
      return { ok: false, message: "This email is already registered. Sign in instead." };
    }

    const user = await createReaderUser({
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: hashPassword(parsed.data.password)
    });

    await createUserSession(asSessionUser(user));
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Unable to create account." };
  }

  redirect("/");
}

export async function signOutAction() {
  await clearUserSession();
  redirect("/");
}

export async function savePostAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return { ok: false, message: "Admin access required." };
  }

  const payload = {
    title: String(formData.get("title") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    summary: String(formData.get("summary") ?? ""),
    body: String(formData.get("body") ?? ""),
    tags: String(formData.get("tags") ?? ""),
    categories: String(formData.get("categories") ?? ""),
    readingMinutes: Number(formData.get("readingMinutes") ?? 0),
    status: String(formData.get("status") ?? "draft")
  };

  const parsed = postInputSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, message: "Post draft validation failed." };
  }

  try {
    await prisma.post.upsert({
      where: { slug: parsed.data.slug },
      update: {
        title: parsed.data.title,
        summary: parsed.data.summary,
        body: parsed.data.body,
        tags: splitCommaList(parsed.data.tags),
        categories: splitCommaList(parsed.data.categories),
        readingMinutes: parsed.data.readingMinutes,
        status: parsed.data.status.toUpperCase() as any,
        publishedAt: parsed.data.status === "published" ? new Date() : null
      },
      create: {
        authorId: user.id,
        slug: parsed.data.slug,
        title: parsed.data.title,
        summary: parsed.data.summary,
        body: parsed.data.body,
        tags: splitCommaList(parsed.data.tags),
        categories: splitCommaList(parsed.data.categories),
        readingMinutes: parsed.data.readingMinutes,
        status: parsed.data.status.toUpperCase() as any,
        publishedAt: parsed.data.status === "published" ? new Date() : null
      }
    });

    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath(`/blog/${parsed.data.slug}`);
    revalidatePath("/admin");
    revalidatePath("/admin/posts");
    return { ok: true, message: "Post saved to the database." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Unable to save post." };
  }
}

export async function saveReadingArticleAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdminSession();
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Admin access required." };
  }

  const payload = {
    sourceUrl: String(formData.get("sourceUrl") ?? ""),
    title: String(formData.get("title") ?? ""),
    publisher: String(formData.get("publisher") ?? ""),
    category: String(formData.get("category") ?? ""),
    note: String(formData.get("note") ?? ""),
    articleType: String(formData.get("articleType") ?? "blog")
  };

  const parsed = readingArticleSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, message: "Enter a valid article URL and optional overrides." };
  }

  try {
    const article = await analyzeExternalArticle({
      sourceUrl: parsed.data.sourceUrl,
      articleType: parsed.data.articleType,
      overrides: {
        title: parsed.data.title || undefined,
        publisher: parsed.data.publisher || undefined,
        category: parsed.data.category || undefined,
        note: parsed.data.note || undefined
      }
    });

    const normalizedTags = normalizeTagLabels(article.tags);

    await prisma.externalArticle.upsert({
      where: { sourceUrl: article.sourceUrl },
      update: {
        title: article.title,
        publisher: article.publisher,
        excerpt: article.excerpt,
        publishedAt: article.publishedAt ? new Date(article.publishedAt) : null,
        category: article.category,
        note: article.note,
        domain: article.domain,
        articleType: article.articleType.toUpperCase() as any,
        analysisStatus: article.analysisStatus,
        analysisProvider: article.analysisProvider,
        analyzedAt: new Date(article.analyzedAt),
        analysisError: article.analysisError ?? null,
        tags: {
          set: [],
          connectOrCreate: normalizedTags.map((tag) => ({
            where: { slug: tag.slug },
            create: { slug: tag.slug, label: tag.label }
          }))
        }
      },
      create: {
        sourceUrl: article.sourceUrl,
        title: article.title,
        publisher: article.publisher,
        excerpt: article.excerpt,
        publishedAt: article.publishedAt ? new Date(article.publishedAt) : null,
        category: article.category,
        note: article.note,
        domain: article.domain,
        articleType: article.articleType.toUpperCase() as any,
        analysisStatus: article.analysisStatus,
        analysisProvider: article.analysisProvider,
        analyzedAt: new Date(article.analyzedAt),
        analysisError: article.analysisError ?? null,
        tags: {
          connectOrCreate: normalizedTags.map((tag) => ({
            where: { slug: tag.slug },
            create: { slug: tag.slug, label: tag.label }
          }))
        }
      }
    });

    revalidatePath("/admin");
    revalidatePath("/admin/content");
    revalidatePath("/news");

    const message =
      article.analysisStatus === "generated"
        ? `Article analyzed and saved with ${article.analysisProvider}.`
        : "Article saved with fallback metadata analysis.";

    return { ok: true, message };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Unable to analyze and save article." };
  }
}

export async function saveContentSourceAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdminSession();
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Admin access required." };
  }

  const payload = {
    name: String(formData.get("name") ?? ""),
    sourceUrl: String(formData.get("sourceUrl") ?? ""),
    feedUrl: String(formData.get("feedUrl") ?? ""),
    sourceType: String(formData.get("sourceType") ?? "blog-index"),
    defaultTopicSlug: String(formData.get("defaultTopicSlug") ?? "")
  };

  const parsed = contentSourceSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, message: "Enter a valid source URL, name, and source type." };
  }

  try {
    const inferred = inferSourceIdentity({
      name: parsed.data.name,
      sourceUrl: parsed.data.sourceUrl,
      feedUrl: parsed.data.feedUrl || undefined
    });
    const topic = parsed.data.defaultTopicSlug
      ? await prisma.topic.findUnique({ where: { slug: parsed.data.defaultTopicSlug } })
      : null;

    await prisma.contentSource.upsert({
      where: { sourceUrl: parsed.data.sourceUrl },
      update: {
        name: parsed.data.name || inferred.name,
        slug: inferred.slug,
        feedUrl: parsed.data.feedUrl || null,
        sourceType: parsed.data.sourceType.replace("-", "_").toUpperCase() as any,
        defaultTopicId: topic?.id ?? null,
        isActive: true
      },
      create: {
        name: parsed.data.name || inferred.name,
        slug: inferred.slug,
        sourceUrl: parsed.data.sourceUrl,
        feedUrl: parsed.data.feedUrl || null,
        sourceType: parsed.data.sourceType.replace("-", "_").toUpperCase() as any,
        defaultTopicId: topic?.id ?? null,
        isActive: true
      }
    });

    revalidatePath("/admin");
    revalidatePath("/admin/content");
    return { ok: true, message: "Source saved. You can import it from the table below." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Unable to save source." };
  }
}

export async function generateSummaryFromFiltersAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdminSession();
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Admin access required." };
  }

  const payload = {
    topicSlug: String(formData.get("topicSlug") ?? ""),
    sourceSlug: String(formData.get("sourceSlug") ?? ""),
    tagSlug: String(formData.get("tagSlug") ?? ""),
    articleType: String(formData.get("articleType") ?? "")
  };

  const parsed = summaryGenerationSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, message: "Choose a topic before generating a summary." };
  }

  try {
    await generateSummaryForFilters({
      topicSlug: parsed.data.topicSlug,
      sourceSlug: parsed.data.sourceSlug || undefined,
      tagSlug: parsed.data.tagSlug || undefined,
      articleType: parsed.data.articleType || undefined
    });

    revalidatePath("/admin");
    revalidatePath("/admin/content");
    revalidatePath("/news");
    revalidatePath(`/news/${parsed.data.topicSlug}`);
    return { ok: true, message: "Summary generated from the current imported content filters." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Unable to generate summary." };
  }
}

export async function runSourceImportAction(formData: FormData) {
  await requireAdminSession();
  const sourceId = String(formData.get("sourceId") ?? "");
  if (!sourceId) {
    return;
  }

  await importSourceById(sourceId);
  revalidatePath("/admin");
  revalidatePath("/admin/content");
  revalidatePath("/news");
}

export async function toggleSourceStatusAction(formData: FormData) {
  await requireAdminSession();
  const sourceId = String(formData.get("sourceId") ?? "");
  if (!sourceId) {
    return;
  }

  const source = await prisma.contentSource.findUnique({ where: { id: sourceId } });
  if (!source) {
    return;
  }

  await prisma.contentSource.update({
    where: { id: sourceId },
    data: { isActive: !source.isActive }
  });

  revalidatePath("/admin/content");
}

export async function createCommentAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireAuthenticatedUser();
  if (!user) {
    return { ok: false, message: "Sign in before posting a comment." };
  }

  const payload = {
    postSlug: String(formData.get("postSlug") ?? ""),
    body: String(formData.get("body") ?? ""),
    parentId: formData.get("parentId") ? String(formData.get("parentId")) : undefined
  };

  const parsed = commentInputSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, message: "Comment validation failed." };
  }

  try {
    const post = await prisma.post.findUnique({ where: { slug: parsed.data.postSlug } });
    if (!post) {
      return { ok: false, message: "This article does not exist." };
    }

    if (parsed.data.parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: parsed.data.parentId } });
      if (!parent || parent.postId !== post.id || parent.parentId) {
        return { ok: false, message: "Only one reply level is supported." };
      }
    }

    const status = user.role === "admin" ? "APPROVED" : "PENDING";

    await prisma.comment.create({
      data: {
        postId: post.id,
        authorId: user.id,
        parentId: parsed.data.parentId,
        body: parsed.data.body,
        status
      }
    });

    revalidatePath(`/blog/${parsed.data.postSlug}`);
    revalidatePath("/admin/comments");
    return {
      ok: true,
      message: status === "APPROVED" ? "Comment published." : "Comment submitted for moderation."
    };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Unable to create comment." };
  }
}

export async function moderateCommentAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return { ok: false, message: "Admin access required." };
  }

  const commentId = String(formData.get("commentId") ?? "");
  const statusValue = String(formData.get("status") ?? "").toUpperCase();
  const allowedStatuses = ["APPROVED", "HIDDEN", "DELETED"];

  if (!commentId || !allowedStatuses.includes(statusValue)) {
    return { ok: false, message: "Invalid moderation request." };
  }

  try {
    const comment = await prisma.comment.update({
      where: { id: commentId },
      data: { status: statusValue as any }
    });
    const post = await prisma.post.findUnique({ where: { id: comment.postId } });

    revalidatePath("/admin/comments");
    if (post) {
      revalidatePath(`/blog/${post.slug}`);
    }
    return { ok: true, message: `Comment marked as ${statusValue.toLowerCase()}.` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Unable to moderate comment." };
  }
}
