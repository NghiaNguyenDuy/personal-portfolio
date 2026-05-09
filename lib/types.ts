export type UserRole = "admin" | "reader";
export type PostStatus = "draft" | "published" | "archived";
export type ArticleType = "blog" | "news";
export type ReadingStatus = "unread" | "reading" | "archived";
export type CommentStatus = "pending" | "approved" | "hidden" | "deleted";
export type ArticleAnalysisStatus = "seed" | "generated" | "fallback";
export type SourceType = "rss" | "atom" | "blog-index" | "manual";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  start: string;
  end: string | null;
  summary: string;
  achievements: string[];
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  stack: string[];
  featured: boolean;
  repoUrl?: string;
  liveUrl?: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  start: string;
  end: string | null;
  summary: string;
  details?: string[];
}

export interface Publication {
  id: string;
  title: string;
  venue: string;
  year: string;
  note?: string;
}

export interface CareerProfile {
  headline: string;
  shortBio: string;
  longBio: string;
  location: string;
  availability: string;
  email: string;
  resumeUrl?: string;
  featuredSkills: string[];
  experiences: Experience[];
  projects: Project[];
  education?: Education[];
  publications?: Publication[];
  honors?: string[];
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string[];
  tags: string[];
  categories: string[];
  status: PostStatus;
  publishedAt: string;
  readingMinutes: number;
  featured?: boolean;
}

export interface Topic {
  id: string;
  slug: string;
  name: string;
  description: string;
  isTracked: boolean;
}

export interface Tag {
  id?: string;
  slug: string;
  label: string;
}

export interface ContentSource {
  id: string;
  slug: string;
  name: string;
  sourceUrl: string;
  feedUrl?: string;
  sourceType: SourceType;
  isActive: boolean;
  defaultTopicSlug?: string;
  lastCheckedAt?: string;
  lastImportedAt?: string;
  lastError?: string;
}

export interface SourceLink {
  title: string;
  publisher: string;
  url: string;
  publishedAt: string;
}

export interface NewsSummary {
  id: string;
  topicSlug: string;
  title: string;
  summary: string[];
  generatedAt: string;
  freshnessLabel: string;
  sourceCount: number;
  articleCount: number;
  provider: string;
  model: string;
  sources: SourceLink[];
  sourceNames: string[];
  tags: Tag[];
}

export interface NewsOverviewSource extends SourceLink {
  id: string;
  sourceName?: string;
  sourceSlug?: string;
  topicSlug?: string;
  category: string;
  articleType: ArticleType;
  excerpt: string;
  tags: Tag[];
}

export interface NewsOverviewGroup {
  label: string;
  count: number;
  href?: string;
  lastPublishedAt?: string;
}

export interface NewsOverview {
  windowDays: number;
  title: string;
  summary: string[];
  itemCount: number;
  sourceCount: number;
  topicCount: number;
  tagCount: number;
  startedAt?: string;
  endedAt?: string;
  sources: NewsOverviewSource[];
  sourceBreakdown: NewsOverviewGroup[];
  topicBreakdown: NewsOverviewGroup[];
  topTags: NewsOverviewGroup[];
}

export interface ExternalArticle {
  id: string;
  sourceUrl: string;
  title: string;
  publisher: string;
  excerpt: string;
  publishedAt: string;
  articleType: ArticleType;
  status: ReadingStatus;
  category: string;
  note: string;
  topicSlug?: string;
  sourceSlug?: string;
  sourceName?: string;
  tags: Tag[];
  analysisStatus?: ArticleAnalysisStatus;
  analysisProvider?: string;
  analyzedAt?: string;
  analysisError?: string;
  importedAt?: string;
  lastSeenAt?: string;
  isSummaryCandidate?: boolean;
}

export interface ContentFilters {
  topic?: string;
  source?: string;
  tag?: string;
  type?: ArticleType;
  q?: string;
}

export interface Comment {
  id: string;
  postSlug: string;
  authorName: string;
  status: CommentStatus;
  body: string;
  createdAt: string;
  parentId?: string;
}
