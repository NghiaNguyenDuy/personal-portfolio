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
  name: "Nghia Nguyen",
  title: "Data Engineer Lead",
  description:
    "A personal data engineering hub for Databricks lakehouse work, PySpark pipelines, platform observability, and source-backed technical signals.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  nav: [
    { href: "/about", label: "About" },
    { href: "/blog", label: "Writing" },
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
  headline: "Data Engineer Lead building Databricks lakehouse platforms, reliable pipelines, and practical data operations.",
  shortBio:
    "Data-driven engineer focused on scalable ETL, Azure cloud data platforms, PySpark, and lakehouse architecture.",
  longBio:
    "I lead data platform initiatives across multinational environments, from legacy SSIS migration into Databricks to regional lakehouse architecture, medallion pipeline design, data quality monitoring, and compute cost visibility. This hub keeps my experience, technical writing, and reading signals organized around the work I actually do: making data systems reliable, usable, and understandable for analytics and reporting teams.",
  location: "Ho Chi Minh City, Vietnam",
  availability: "Currently consolidating portfolio work around data engineering leadership, platform modernization, and applied analytics systems.",
  email: "nghiand19406c@gmail.com",
  resumeUrl: "#",
  featuredSkills: [
    "Databricks",
    "PySpark",
    "Azure Cloud",
    "Data Lakehouse",
    "Medallion Architecture",
    "SQL",
    "Python",
    "Azure DevOps"
  ],
  experiences: [
    {
      id: "exp-1",
      company: "Collectius Group",
      role: "Data Engineer Lead",
      start: "2023",
      end: null,
      summary: "Leads regional data platform modernization, Databricks migration, lakehouse architecture, and production data operations.",
      achievements: [
        "Led migration of legacy ETL pipelines from SSIS to Databricks for scalable cloud-based data processing.",
        "Architected a regional data lakehouse consolidating OLTP data across six countries into a single source of truth for analytics and reporting.",
        "Designed and maintained Bronze, Silver, and Gold medallion pipelines to improve reliability, usability, and downstream analytical consumption.",
        "Established automated monitoring for pipeline health, job status, and data quality checks to improve observability and incident response.",
        "Built resource monitoring across clusters, workloads, and user groups to improve compute cost visibility and usage efficiency."
      ]
    },
    {
      id: "exp-2",
      company: "Deloitte Vietnam",
      role: "Tax Data Analyst",
      start: "2023-04",
      end: "2023-06",
      summary: "Delivered data extraction, validation, and anomaly detection workflows for tax and audit-related analysis.",
      achievements: [
        "Developed an intelligent document processing pipeline with Azure Form Recognizer, Python, and SQL to extract and validate invoice data from unstructured PDFs.",
        "Built rule-based anomaly detection for GL data with Regex and Pandas to support abnormal-record detection and audit analysis.",
        "Engineered XML-to-tabular transformation pipelines for downstream integration and reporting.",
        "Delivered Streamlit applications for data validation and reporting to speed review cycles and stakeholder interaction."
      ]
    },
    {
      id: "exp-3",
      company: "Heineken Vietnam",
      role: "Data Science Intern",
      start: "2022-10",
      end: "2023-03",
      summary: "Applied forecasting and automation to distributor target planning and internal business tooling.",
      achievements: [
        "Applied time series forecasting to optimize distributor target setting and support planning decisions.",
        "Automated sales target allocation workflows with Python and object-oriented design.",
        "Improved internal ASP.NET application usability through UI/UX redesign for business users."
      ]
    }
  ],
  projects: [
    {
      id: "proj-1",
      title: "Regional Databricks Lakehouse",
      slug: "regional-databricks-lakehouse",
      summary: "A regional lakehouse consolidating operational data across six countries.",
      description:
        "Architected a Databricks-based lakehouse to unify OLTP sources across six countries and provide a governed single source of truth for analytics, reporting, and downstream consumption.",
      stack: ["Databricks", "PySpark", "Azure", "Delta Lake"],
      featured: true,
      repoUrl: "#",
      liveUrl: "#"
    },
    {
      id: "proj-2",
      title: "Medallion Pipeline Modernization",
      slug: "medallion-pipeline-modernization",
      summary: "Bronze, Silver, and Gold data pipelines replacing legacy ETL workflows.",
      description:
        "Led migration from SSIS-style batch ETL toward medallion-based Databricks pipelines, improving data reliability, usability, and analytical readiness.",
      stack: ["Databricks Workflows", "PySpark", "SQL", "Azure DevOps"],
      featured: true,
      repoUrl: "#",
      liveUrl: "#"
    },
    {
      id: "proj-3",
      title: "Data Observability and Cost Control",
      slug: "data-observability-cost-control",
      summary: "Monitoring for pipeline health, job status, data quality, and compute usage.",
      description:
        "Established operational monitoring for pipeline health, data quality checks, cluster usage, workload patterns, and user-group resource consumption to improve incident response and budget visibility.",
      stack: ["Databricks", "Azure", "Monitoring", "Data Quality"],
      featured: true,
      repoUrl: "#",
      liveUrl: "#"
    },
    {
      id: "proj-4",
      title: "Intelligent Document Processing",
      slug: "intelligent-document-processing",
      summary: "Invoice extraction and validation from unstructured PDFs.",
      description:
        "Built an Azure Form Recognizer, Python, and SQL pipeline to extract invoice data, validate records, and support tax/audit analysis with anomaly detection workflows.",
      stack: ["Azure Form Recognizer", "Python", "SQL", "Pandas"],
      featured: true,
      repoUrl: "#",
      liveUrl: "#"
    }
  ],
  education: [
    {
      id: "edu-master",
      institution: "University of Information Technology, VNU HCM",
      degree: "Master of Information Systems",
      start: "2024-12",
      end: null,
      summary: "Advanced studies in information systems architecture and data engineering technologies."
    },
    {
      id: "edu-bachelor",
      institution: "Vietnam National University - HCM, Faculty of Information Systems",
      degree: "Bachelor of Management Information System",
      start: "2019-08",
      end: "2023-07",
      summary: "GPA 8.37/10, honors program, top 1% of faculty."
    }
  ],
  publications: [
    {
      id: "pub-recommendation",
      title: "A Personalized Product Recommendation Model in E-commerce Based on Retrieval Strategy",
      venue: "Journal of Open Innovation: Technology, Market, and Complexity",
      year: "2024",
      note: "Scopus Q1"
    },
    {
      id: "pub-card-fraud",
      title: "A Proposed Model for Card Fraud Detection Based on CatBoost and Deep Neural Network",
      venue: "IEEE Access",
      year: "2022",
      note: "SCIE indexed, Scopus Q1"
    },
    {
      id: "pub-catboost",
      title: "Applying CatBoost Model for Detecting Fraudulent Credit Card",
      venue: "National Conference for Information Systems in Business and Management",
      year: "2022"
    }
  ],
  honors: [
    "2024 Master Scholarship sponsored by Vingroup Innovation Foundation",
    "2022 Talented Scholarship sponsored by VALLET",
    "2022 1st Prize, University-Level Young Scientist Contest, UEL Faculty of Information Systems",
    "2020 Certificate of Achievement, ICPC Vietnam Southern Provincial Programming Contest"
  ]
};

export const topics: Topic[] = [
  {
    id: "topic-ai",
    slug: "ai-engineering",
    name: "Applied AI & Analytics",
    description: "AI-assisted analysis, model evaluation, recommendation systems, and production analytics patterns.",
    isTracked: true
  },
  {
    id: "topic-web",
    slug: "web-platforms",
    name: "Data Platform Operations",
    description: "Pipeline observability, data quality, orchestration, cost monitoring, and production support.",
    isTracked: true
  },
  {
    id: "topic-data",
    slug: "data-systems",
    name: "Lakehouse Systems",
    description: "Databricks, medallion architecture, cloud data platforms, and scalable analytics engineering.",
    isTracked: true
  }
];

export const tags: Tag[] = [
  { slug: "lakehouse", label: "Lakehouse" },
  { slug: "data-infra", label: "Data Infra" },
  { slug: "databricks", label: "Databricks" },
  { slug: "azure", label: "Azure" },
  { slug: "pyspark", label: "PySpark" },
  { slug: "data-quality", label: "Data Quality" },
  { slug: "cost-control", label: "Cost Control" },
  { slug: "forecasting", label: "Forecasting" }
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
    id: "source-azure",
    slug: "azure-blog",
    name: "Microsoft Azure Blog",
    sourceUrl: "https://azure.microsoft.com/en-us/blog/",
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
    slug: "modernizing-ssis-etl-into-databricks-lakehouse",
    title: "Modernizing SSIS ETL into a Databricks Lakehouse",
    summary: "A practical note on migrating legacy batch pipelines into medallion-based Databricks workflows.",
    body: [
      "A legacy ETL migration is not only a tooling change. The hard part is preserving business trust while moving transformation logic, orchestration, quality checks, and downstream reporting contracts into a cloud data platform.",
      "The lakehouse pattern worked best when the ingestion boundary, transformation layers, and reporting-ready outputs were explicit. Bronze kept source-aligned data, Silver handled standardization and quality rules, and Gold served analytics consumption.",
      "Operational visibility mattered as much as the pipeline code. Job status, data quality checks, and cluster usage monitoring gave the platform team a clearer way to support production workloads and control compute spend."
    ],
    tags: ["databricks", "lakehouse", "etl"],
    categories: ["Data Engineering"],
    status: "published",
    publishedAt: "2026-03-16",
    readingMinutes: 6,
    featured: true
  },
  {
    id: "post-2",
    slug: "pipeline-observability-and-compute-cost-control",
    title: "Pipeline Observability and Compute Cost Control",
    summary: "Notes on monitoring pipeline health, data quality, and Databricks resource usage as part of platform operations.",
    body: [
      "Data platform reliability depends on signals that are visible before stakeholders report broken dashboards. Pipeline health, job status, freshness, and quality checks should be treated as first-class operational data.",
      "Compute usage also needs ownership. Monitoring clusters, workloads, and user groups helps teams understand which jobs consume budget and which patterns deserve optimization.",
      "The useful operating model is simple: make failure states visible, connect them to owners, and keep cost and reliability discussions grounded in the same platform evidence."
    ],
    tags: ["observability", "databricks", "cost-control"],
    categories: ["Platform Operations"],
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
    sourceUrl: "https://azure.microsoft.com/en-us/blog/",
    title: "Operational patterns for cloud data platform reliability",
    publisher: "Microsoft Azure Blog",
    excerpt: "A practical view of platform monitoring, workload ownership, and cloud operations for data teams.",
    publishedAt: "2026-03-18T08:30:00.000Z",
    importedAt: "2026-03-19T05:20:00.000Z",
    lastSeenAt: "2026-03-19T05:20:00.000Z",
    articleType: "blog",
    status: "unread",
    category: "Operations",
    note: "Useful source material for connecting pipeline health, compute usage, and platform ownership.",
    topicSlug: "web-platforms",
    sourceSlug: "azure-blog",
    sourceName: "Microsoft Azure Blog",
    tags: [tags[3], tags[5], tags[6]],
    analysisStatus: "seed",
    analysisProvider: "seed-data",
    analyzedAt: "2026-03-19T05:20:00.000Z",
    isSummaryCandidate: true
  },
  {
    id: "reading-3",
    sourceUrl: "https://openai.com/news/evals-in-production",
    title: "Evaluation-first workflows for AI-assisted analytics",
    publisher: "OpenAI News",
    excerpt: "Teams are operationalizing model changes through evaluation suites, rollout gates, and clearer regression monitoring.",
    publishedAt: "2026-03-18T10:00:00.000Z",
    importedAt: "2026-03-19T04:40:00.000Z",
    lastSeenAt: "2026-03-19T04:40:00.000Z",
    articleType: "news",
    status: "reading",
    category: "Analytics",
    note: "Strong source for linking evaluation workflows to safer AI-assisted analytics and recommendation systems.",
    topicSlug: "ai-engineering",
    sourceSlug: "openai-blog",
    sourceName: "OpenAI Blog",
    tags: [tags[5], tags[7]],
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
    title: "Applied AI roundup: evaluation gates and analytics reliability",
    summary: [
      "Teams are tightening AI-assisted analytics workflows around evaluation coverage, approval-aware deployment, and staged rollout practices.",
      "The strongest signals connect model behavior back to measurable downstream reliability rather than benchmark-only narratives.",
      "This is especially relevant for recommendation, fraud detection, and decision-support systems where explainability and regression control matter."
    ],
    generatedAt: "2026-03-19T06:30:00.000Z",
    freshnessLabel: "Generated today",
    sourceCount: 1,
    articleCount: 1,
    provider: "Imported sources + OpenAI",
    model: "gpt-4.1-mini",
    sourceNames: ["OpenAI Blog"],
    tags: [tags[5], tags[7]],
    sources: [
      {
        title: "Evaluation-first workflows for AI-assisted analytics",
        publisher: "OpenAI News",
        url: "https://openai.com/news/evals-in-production",
        publishedAt: "2026-03-18T10:00:00.000Z"
      }
    ]
  },
  {
    id: "summary-2",
    topicSlug: "web-platforms",
    title: "Data Platform Ops roundup: observability and cost control",
    summary: [
      "The clearest operating trend is making pipeline health, freshness, data quality, and job status visible before business users report issues.",
      "Cloud data teams are also treating compute cost as platform telemetry, with usage visibility across clusters, workloads, and user groups."
    ],
    generatedAt: "2026-03-19T05:40:00.000Z",
    freshnessLabel: "Generated today",
    sourceCount: 1,
    articleCount: 1,
    provider: "Imported sources + OpenAI",
    model: "gpt-4.1-mini",
    sourceNames: ["Microsoft Azure Blog"],
    tags: [tags[3], tags[5], tags[6]],
    sources: [
      {
        title: "Operational patterns for cloud data platform reliability",
        publisher: "Microsoft Azure Blog",
        url: "https://azure.microsoft.com/en-us/blog/",
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
    postSlug: "modernizing-ssis-etl-into-databricks-lakehouse",
    authorName: "Lan Reader",
    status: "approved",
    body: "The Bronze, Silver, Gold split makes the migration story much easier to reason about.",
    createdAt: "2026-03-17T09:00:00.000Z"
  },
  {
    id: "comment-2",
    postSlug: "modernizing-ssis-etl-into-databricks-lakehouse",
    authorName: "Minh Nguyen",
    status: "approved",
    body: "Exactly. It gives each layer a clear responsibility and keeps downstream consumers away from raw operational complexity.",
    createdAt: "2026-03-17T10:00:00.000Z",
    parentId: "comment-1"
  }
];
