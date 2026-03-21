import { createHash, randomBytes, scryptSync } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { careerProfile, comments, contentSources, posts, readingList, summaries, tags, topics } from "@/lib/data";
import { slugify } from "@/lib/utils";

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function stableId(input: string) {
  return createHash("sha256").update(input).digest("hex").slice(0, 24);
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "change-this-admin-password";

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "Portfolio Admin",
      role: "ADMIN",
      passwordHash: hashPassword(adminPassword)
    },
    create: {
      email: adminEmail,
      name: "Portfolio Admin",
      role: "ADMIN",
      passwordHash: hashPassword(adminPassword)
    }
  });

  const reader = await prisma.user.upsert({
    where: { email: "reader@example.com" },
    update: {
      name: "Lan Reader",
      role: "READER",
      passwordHash: hashPassword("readerpass123")
    },
    create: {
      email: "reader@example.com",
      name: "Lan Reader",
      role: "READER",
      passwordHash: hashPassword("readerpass123")
    }
  });

  await prisma.comment.deleteMany();
  await prisma.summarySource.deleteMany();
  await prisma.newsSummary.deleteMany();
  await prisma.externalArticle.deleteMany();
  await prisma.contentSource.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.post.deleteMany();
  await prisma.careerProfile.deleteMany();

  const profile = await prisma.careerProfile.create({
    data: {
      headline: careerProfile.headline,
      shortBio: careerProfile.shortBio,
      longBio: careerProfile.longBio,
      email: careerProfile.email,
      location: careerProfile.location,
      availability: careerProfile.availability,
      resumeUrl: careerProfile.resumeUrl,
      featuredSkills: careerProfile.featuredSkills,
      experiences: {
        create: careerProfile.experiences.map((experience, index) => ({
          company: experience.company,
          role: experience.role,
          startDate: new Date(`${experience.start}-01`),
          endDate: experience.end ? new Date(`${experience.end}-01`) : null,
          summary: experience.summary,
          achievements: experience.achievements,
          sortOrder: index
        }))
      },
      projects: {
        create: careerProfile.projects.map((project, index) => ({
          title: project.title,
          slug: project.slug,
          summary: project.summary,
          description: project.description,
          stack: project.stack,
          repoUrl: project.repoUrl,
          liveUrl: project.liveUrl,
          featured: project.featured,
          sortOrder: index
        }))
      }
    }
  });

  const topicMap = new Map<string, string>();
  for (const topic of topics) {
    const created = await prisma.topic.create({
      data: {
        slug: topic.slug,
        name: topic.name,
        description: topic.description,
        isTracked: topic.isTracked
      }
    });
    topicMap.set(topic.slug, created.id);
  }

  const tagMap = new Map<string, string>();
  for (const tag of tags) {
    const created = await prisma.tag.create({
      data: {
        slug: tag.slug,
        label: tag.label
      }
    });
    tagMap.set(tag.slug, created.id);
  }

  const sourceMap = new Map<string, string>();
  for (const source of contentSources) {
    const created = await prisma.contentSource.create({
      data: {
        slug: source.slug || slugify(source.name),
        name: source.name,
        sourceUrl: source.sourceUrl,
        feedUrl: source.feedUrl ?? null,
        sourceType: source.sourceType.replace("-", "_").toUpperCase() as any,
        isActive: source.isActive,
        defaultTopicId: source.defaultTopicSlug ? topicMap.get(source.defaultTopicSlug) : null,
        lastCheckedAt: source.lastCheckedAt ? new Date(source.lastCheckedAt) : null,
        lastImportedAt: source.lastImportedAt ? new Date(source.lastImportedAt) : null,
        lastError: source.lastError ?? null
      }
    });
    sourceMap.set(source.slug, created.id);
  }

  for (const post of posts) {
    await prisma.post.create({
      data: {
        authorId: admin.id,
        slug: post.slug,
        title: post.title,
        summary: post.summary,
        body: post.body.join("\n\n"),
        tags: post.tags,
        categories: post.categories,
        readingMinutes: post.readingMinutes,
        status: post.status.toUpperCase() as any,
        publishedAt: new Date(post.publishedAt)
      }
    });
  }

  const articleIdsByUrl = new Map<string, string>();
  for (const item of readingList) {
    const created = await prisma.externalArticle.create({
      data: {
        sourceId: item.sourceSlug ? sourceMap.get(item.sourceSlug) : null,
        topicId: item.topicSlug ? topicMap.get(item.topicSlug) : null,
        sourceUrl: item.sourceUrl,
        title: item.title,
        publisher: item.publisher,
        excerpt: item.excerpt,
        publishedAt: new Date(item.publishedAt),
        articleType: item.articleType.toUpperCase() as any,
        status: item.status.toUpperCase() as any,
        category: item.category,
        note: item.note,
        domain: new URL(item.sourceUrl).hostname,
        analysisStatus: item.analysisStatus ?? null,
        analysisProvider: item.analysisProvider ?? null,
        analyzedAt: item.analyzedAt ? new Date(item.analyzedAt) : null,
        analysisError: item.analysisError ?? null,
        importedAt: item.importedAt ? new Date(item.importedAt) : new Date(item.publishedAt),
        lastSeenAt: item.lastSeenAt ? new Date(item.lastSeenAt) : new Date(item.publishedAt),
        isSummaryCandidate: item.isSummaryCandidate ?? true,
        tags: {
          connect: item.tags.map((tag) => ({ slug: tag.slug }))
        }
      }
    });
    articleIdsByUrl.set(item.sourceUrl, created.id);
  }

  for (const summary of summaries) {
    const created = await prisma.newsSummary.create({
      data: {
        topicId: topicMap.get(summary.topicSlug)!,
        title: summary.title,
        summary: summary.summary.join("\n\n"),
        generatedAt: new Date(summary.generatedAt),
        sourceCount: summary.sourceCount,
        articleCount: summary.articleCount,
        provider: summary.provider,
        model: summary.model,
        freshnessLabel: summary.freshnessLabel,
        articles: {
          connect: summary.sources
            .map((source) => articleIdsByUrl.get(source.url))
            .filter((id): id is string => Boolean(id))
            .map((id) => ({ id }))
        },
        sources: {
          create: summary.sources.map((source) => ({
            title: source.title,
            publisher: source.publisher,
            url: source.url,
            publishedAt: new Date(source.publishedAt)
          }))
        }
      }
    });

    void created;
  }

  for (const comment of comments) {
    const post = await prisma.post.findUniqueOrThrow({ where: { slug: comment.postSlug } });
    const author = comment.authorName === "Lan Reader" ? reader : admin;
    await prisma.comment.create({
      data: {
        id: stableId(comment.id),
        body: comment.body,
        status: comment.status.toUpperCase() as any,
        postId: post.id,
        authorId: author.id,
        createdAt: new Date(comment.createdAt)
      }
    });
  }

  const reply = comments.find((comment) => comment.parentId);
  if (reply) {
    await prisma.comment.update({
      where: { id: stableId(reply.id) },
      data: { parentId: stableId(reply.parentId!) }
    });
  }

  console.log(`Seeded profile ${profile.id}, ${contentSources.length} sources, and ${readingList.length} imported items.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
