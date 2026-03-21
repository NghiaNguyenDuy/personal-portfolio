import { careerProfile, comments, posts, readingList, summaries, topics } from "@/lib/data";
import type { Comment, ExternalArticle, NewsSummary, Post, Topic } from "@/lib/types";
import { byDateDesc } from "@/lib/utils";

export function getCareerProfile() {
  return careerProfile;
}

export function getPublishedPosts(): Post[] {
  return byDateDesc(posts.filter((post) => post.status === "published"));
}

export function getFeaturedPosts(): Post[] {
  return getPublishedPosts().filter((post) => post.featured);
}

export function getPostBySlug(slug: string) {
  return getPublishedPosts().find((post) => post.slug === slug);
}

export function getTopics(): Topic[] {
  return topics.filter((topic) => topic.isTracked);
}

export function getSummaries(): NewsSummary[] {
  return byDateDesc(summaries);
}

export function getSummaryByTopic(slug: string) {
  return getSummaries().find((summary) => summary.topicSlug === slug);
}

export function getReadingList(): ExternalArticle[] {
  return byDateDesc(readingList);
}

export function getCommentsByPost(slug: string): Comment[] {
  return comments.filter((comment) => comment.postSlug === slug && comment.status === "approved");
}
