import type {
  CareerProfile,
  Comment,
  ContentSource,
  ExternalArticle,
  NewsSummary,
  Post,
  Tag,
  Topic,
  User
} from "@/lib/types";

export const siteConfig = {
  name: "Nguyen Portfolio",
  title: "Senior Fullstack Engineer",
  description:
    "A portfolio for career storytelling, engineering writing, curated reading, and AI-assisted news summaries.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  nav: [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/blog", label: "Blog" },
    { href: "/news", label: "Signals" },
    { href: "/contact", label: "Contact" }
  ]
};

export const demoUsers: User[] = [
  {
    id: "u-admin",
    name: "Nguyen Admin",
    email: "admin@example.com",
    role: "admin"
  },
  {
    id: "u-reader",
    name: "Lan Reader",
    email: "reader@example.com",
    role: "reader"
  }
];

export const careerProfile: CareerProfile = {
  headline: "I build product-focused web platforms with strong backend and editorial workflows.",
  shortBio:
    "Senior fullstack engineer focused on pragmatic architecture, readable interfaces, and cost-efficient delivery.",
  longBio:
    "I design and ship fullstack products where content, data workflows, and user-facing experience need to fit together cleanly. My preferred stack is TypeScript, React, Next.js, Node.js, and PostgreSQL, with a strong bias toward maintainable architecture, durable data models, and straightforward operations.",
  location: "Ho Chi Minh City, Vietnam",
  availability: "Open to full-time and contract product engineering roles.",
  email: "hello@example.com",
  resumeUrl: "#",
  featuredSkills: ["Next.js", "TypeScript", "Node.js", "PostgreSQL", "Prisma", "System Design"],
  experiences: [
    {
      id: "exp-1",
      company: "Product Studio",
      role: "Senior Fullstack Engineer",
      start: "2023-01",
      end: null,
      summary: "Led delivery of content-heavy web products with server-rendered interfaces and data-rich admin flows.",
      achievements: [
        "Reduced feature delivery time by standardizing app and API boundaries.",
        "Improved page performance through cache-aware rendering and lean client state.",
        "Introduced editorial workflows for publishing, moderation, and content review."
      ]
    },
    {
      id: "exp-2",
      company: "Platform Team",
      role: "Fullstack Engineer",
      start: "2020-03",
      end: "2022-12",
      summary: "Built internal tools and user-facing systems across React frontends and Node.js services.",
      achievements: [
        "Built workflow tools for operations and support teams.",
        "Designed reusable service patterns for auth, validation, and persistence.",
        "Collaborated with design and product to simplify complex interfaces."
      ]
    }
  ],
  projects: [
    {
      id: "proj-1",
      title: "Editorial Command Center",
      slug: "editorial-command-center",
      summary: "A publishing and moderation platform for content teams.",
      description: "Designed a unified admin workflow for publishing, moderation, analytics review, and issue handling.",
      stack: ["Next.js", "TypeScript", "PostgreSQL"],
      featured: true,
      repoUrl: "#",
      liveUrl: "#"
    },
    {
      id: "proj-2",
      title: "News Insight Pipeline",
      slug: "news-insight-pipeline",
      summary: "A source-driven summarization pipeline for tracked industry topics.",
      description: "Combined source ingestion, article analysis, tag filtering, and cached topic summaries with traceable inputs.",
      stack: ["Node.js", "Prisma", "OpenAI"],
      featured: true,
      repoUrl: "#",
      liveUrl: "#"
    }
  ]
};

export const topics: Topic[] = [
  {
    id: "topic-ai",
    slug: "ai-engineering",
    name: "AI Engineering",
    description: "Tooling, infra, APIs, and practical application delivery for LLM products.",
    isTracked: true
  },
  {
    id: "topic-web",
    slug: "web-platforms",
    name: "Web Platforms",
    description: "Frontend frameworks, server rendering, web performance, and developer tooling.",
    isTracked: true
  },
  {
    id: "topic-data",
    slug: "data-systems",
    name: "Data Systems",
    description: "Streaming, warehousing, analytics engineering, and scalable data products.",
    isTracked: true
  }
];

export const tags: Tag[] = [
  { slug: "lakehouse", label: "Lakehouse" },
  { slug: "data-infra", label: "Data Infra" },
  { slug: "vector-db", label: "Vector DB" },
  { slug: "react", label: "React" },
  { slug: "server-rendering", label: "Server Rendering" },
  { slug: "evaluation", label: "Evaluation" },
  { slug: "model-routing", label: "Model Routing" },
  { slug: "caching", label: "Caching" }
];

export const contentSources: ContentSource[] = [
  {
    id: "source-databricks",
    slug: "databricks-blog",
    name: "Databricks Blog",
    sourceUrl: "https://www.databricks.com/blog",
    sourceType: "blog-index",
    isActive: true,
    defaultTopicSlug: "data-systems",
    lastImportedAt: "2026-03-19T06:20:00.000Z"
  },
  {
    id: "source-vercel",
    slug: "vercel-blog",
    name: "Vercel Blog",
    sourceUrl: "https://vercel.com/blog",
    sourceType: "blog-index",
    isActive: true,
    defaultTopicSlug: "web-platforms",
    lastImportedAt: "2026-03-19T05:20:00.000Z"
  },
  {
    id: "source-openai",
    slug: "openai-blog",
    name: "OpenAI Blog",
    sourceUrl: "https://openai.com/news",
    sourceType: "blog-index",
    isActive: true,
    defaultTopicSlug: "ai-engineering",
    lastImportedAt: "2026-03-19T04:40:00.000Z"
  }
];

export const posts: Post[] = [
  {
    id: "post-1",
    slug: "building-a-pragmatic-editorial-stack",
    title: "Building a Pragmatic Editorial Stack",
    summary: "How to design a writing platform that stays fast for readers and maintainable for a solo builder.",
    body: [
      "Most publishing systems become harder to maintain when editorial needs are bolted on late. Drafts, moderation, metadata, previews, and scheduling affect both schema design and UI shape from the start.",
      "The cheapest architecture is usually the one that keeps content pages static, keeps admin workflows server-driven, and avoids custom infrastructure until content volume proves it is necessary.",
      "If a product mixes public writing, internal curation, and discussion, establish a clean boundary between public content, private notes, and moderation data early."
    ],
    tags: ["architecture", "content-platform"],
    categories: ["Engineering"],
    status: "published",
    publishedAt: "2026-03-16",
    readingMinutes: 6,
    featured: true
  },
  {
    id: "post-2",
    slug: "designing-cost-aware-news-summaries",
    title: "Designing Cost-Aware News Summaries",
    summary: "A practical pattern for scheduled topic summaries that do not burn tokens on every page view.",
    body: [
      "Summaries should be generated on a schedule, not on public request, when your goal is predictable cost. Cached summaries plus freshness timestamps are enough for most readers.",
      "The expensive part is not only the model call. Article collection, deduplication, retries, and monitoring also need to be bounded if the system is going to stay cheap to run.",
      "A good v1 uses a small tracked topic set, one summarization provider, and clear admin visibility into failures."
    ],
    tags: ["llm", "ops", "news"],
    categories: ["Practice"],
    status: "published",
    publishedAt: "2026-03-14",
    readingMinutes: 5
  }
];

export const readingList: ExternalArticle[] = [
  {
    id: "reading-1",
    sourceUrl: "https://www.databricks.com/blog/lakehouse-governance-patterns",
    title: "Lakehouse governance patterns for scaling analytics platforms",
    publisher: "Databricks Blog",
    excerpt: "A practical walkthrough of governance controls, data product boundaries, and platform operating models.",
    publishedAt: "2026-03-19T02:00:00.000Z",
    importedAt: "2026-03-19T06:20:00.000Z",
    lastSeenAt: "2026-03-19T06:20:00.000Z",
    articleType: "blog",
    status: "reading",
    category: "Data",
    note: "Useful reference for governance and domain ownership tradeoffs in modern data platforms.",
    topicSlug: "data-systems",
    sourceSlug: "databricks-blog",
    sourceName: "Databricks Blog",
    tags: [tags[0], tags[1]],
    analysisStatus: "seed",
    analysisProvider: "seed-data",
    analyzedAt: "2026-03-19T06:20:00.000Z",
    isSummaryCandidate: true
  },
  {
    id: "reading-2",
    sourceUrl: "https://vercel.com/blog/cache-graphs-and-server-rendering",
    title: "Cache graphs and server rendering discipline",
    publisher: "Vercel Blog",
    excerpt: "A closer look at partial prerendering, cache boundaries, and reducing duplicated client work.",
    publishedAt: "2026-03-18T08:30:00.000Z",
    importedAt: "2026-03-19T05:20:00.000Z",
    lastSeenAt: "2026-03-19T05:20:00.000Z",
    articleType: "blog",
    status: "unread",
    category: "Web",
    note: "Good source material for explaining cache-aware UI architecture and server-first rendering.",
    topicSlug: "web-platforms",
    sourceSlug: "vercel-blog",
    sourceName: "Vercel Blog",
    tags: [tags[3], tags[4], tags[7]],
    analysisStatus: "seed",
    analysisProvider: "seed-data",
    analyzedAt: "2026-03-19T05:20:00.000Z",
    isSummaryCandidate: true
  },
  {
    id: "reading-3",
    sourceUrl: "https://openai.com/news/evals-in-production",
    title: "Evaluation-first release workflows for LLM products",
    publisher: "OpenAI News",
    excerpt: "Teams are operationalizing model changes through eval suites, rollout gates, and clearer regression monitoring.",
    publishedAt: "2026-03-18T10:00:00.000Z",
    importedAt: "2026-03-19T04:40:00.000Z",
    lastSeenAt: "2026-03-19T04:40:00.000Z",
    articleType: "news",
    status: "reading",
    category: "AI",
    note: "Strong source for linking evaluation workflows to safer assistant product rollouts.",
    topicSlug: "ai-engineering",
    sourceSlug: "openai-blog",
    sourceName: "OpenAI Blog",
    tags: [tags[5], tags[6]],
    analysisStatus: "seed",
    analysisProvider: "seed-data",
    analyzedAt: "2026-03-19T04:40:00.000Z",
    isSummaryCandidate: true
  }
];

export const summaries: NewsSummary[] = [
  {
    id: "summary-1",
    topicSlug: "ai-engineering",
    title: "AI Engineering roundup: evaluation gates and cost-aware routing",
    summary: [
      "Teams are tightening LLM release processes around eval coverage, approval-aware deployment, and staged rollouts rather than broad experimentation.",
      "Model routing remains a dominant cost-control theme, with smaller models handling routine workloads and premium models reserved for escalations.",
      "The strongest signals are coming from product teams publishing concrete operational practices instead of benchmark-driven narratives."
    ],
    generatedAt: "2026-03-19T06:30:00.000Z",
    freshnessLabel: "Generated today",
    sourceCount: 1,
    articleCount: 1,
    provider: "Imported sources + OpenAI",
    model: "gpt-4.1-mini",
    sourceNames: ["OpenAI Blog"],
    tags: [tags[5], tags[6]],
    sources: [
      {
        title: "Evaluation-first release workflows for LLM products",
        publisher: "OpenAI News",
        url: "https://openai.com/news/evals-in-production",
        publishedAt: "2026-03-18T10:00:00.000Z"
      }
    ]
  },
  {
    id: "summary-2",
    topicSlug: "web-platforms",
    title: "Web Platforms roundup: cache discipline and server-first ergonomics",
    summary: [
      "The clearest implementation trend is better cache discipline: teams are making cache boundaries visible in architecture and reducing duplicated fetch logic.",
      "Server-first rendering continues to win where content density and predictable delivery matter more than interactive client complexity."
    ],
    generatedAt: "2026-03-19T05:40:00.000Z",
    freshnessLabel: "Generated today",
    sourceCount: 1,
    articleCount: 1,
    provider: "Imported sources + OpenAI",
    model: "gpt-4.1-mini",
    sourceNames: ["Vercel Blog"],
    tags: [tags[3], tags[4], tags[7]],
    sources: [
      {
        title: "Cache graphs and server rendering discipline",
        publisher: "Vercel Blog",
        url: "https://vercel.com/blog/cache-graphs-and-server-rendering",
        publishedAt: "2026-03-18T08:30:00.000Z"
      }
    ]
  },
  {
    id: "summary-3",
    topicSlug: "data-systems",
    title: "Data Systems roundup: platform governance and operating-model clarity",
    summary: [
      "Platform conversations are shifting away from generic modernization narratives and toward clear ownership boundaries, governance controls, and productized data contracts.",
      "Teams are treating the lakehouse less as a brand label and more as an operating model that needs durable platform rules."
    ],
    generatedAt: "2026-03-19T06:10:00.000Z",
    freshnessLabel: "Generated today",
    sourceCount: 1,
    articleCount: 1,
    provider: "Imported sources + OpenAI",
    model: "gpt-4.1-mini",
    sourceNames: ["Databricks Blog"],
    tags: [tags[0], tags[1]],
    sources: [
      {
        title: "Lakehouse governance patterns for scaling analytics platforms",
        publisher: "Databricks Blog",
        url: "https://www.databricks.com/blog/lakehouse-governance-patterns",
        publishedAt: "2026-03-19T02:00:00.000Z"
      }
    ]
  }
];

export const comments: Comment[] = [
  {
    id: "comment-1",
    postSlug: "building-a-pragmatic-editorial-stack",
    authorName: "Lan Reader",
    status: "approved",
    body: "The boundary between public content and private editorial notes is the part most teams miss. Good callout.",
    createdAt: "2026-03-17T09:00:00.000Z"
  },
  {
    id: "comment-2",
    postSlug: "building-a-pragmatic-editorial-stack",
    authorName: "Minh Nguyen",
    status: "approved",
    body: "Agreed. It prevents accidental data leakage and keeps admin workflows simpler over time.",
    createdAt: "2026-03-17T10:00:00.000Z",
    parentId: "comment-1"
  }
];
