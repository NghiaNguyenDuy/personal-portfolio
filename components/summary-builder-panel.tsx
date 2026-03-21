"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/actions";
import type { ContentFilters, ContentSource, Tag, Topic } from "@/lib/types";

const initialState: ActionState = { ok: false, message: "" };

interface SummaryBuilderPanelProps {
  topics: Topic[];
  sources: ContentSource[];
  tags: Tag[];
  filters: ContentFilters;
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
}

export function SummaryBuilderPanel({ topics, sources, tags, filters, action }: SummaryBuilderPanelProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <section className="card admin-panel">
      <div className="section-heading">
        <p className="eyebrow">Summary builder</p>
        <h2>Generate from imported items</h2>
        <p className="section-description">Pick a topic and optional source/tag filters. The summary will be built from stored imported content, not a live News API search.</p>
      </div>
      <form action={formAction} className="admin-form">
        <label>
          <span>Topic</span>
          <select name="topicSlug" defaultValue={filters.topic ?? topics[0]?.slug ?? ""} required>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.slug}>
                {topic.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Source</span>
          <select name="sourceSlug" defaultValue={filters.source ?? ""}>
            <option value="">All sources</option>
            {sources.map((source) => (
              <option key={source.id} value={source.slug}>
                {source.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Tag</span>
          <select name="tagSlug" defaultValue={filters.tag ?? ""}>
            <option value="">All tags</option>
            {tags.map((tag) => (
              <option key={tag.slug} value={tag.slug}>
                {tag.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Type</span>
          <select name="articleType" defaultValue={filters.type ?? ""}>
            <option value="">Blogs and news</option>
            <option value="blog">Blogs</option>
            <option value="news">News</option>
          </select>
        </label>
        <div className="form-actions">
          <button type="submit" disabled={pending}>
            {pending ? "Generating..." : "Generate summary"}
          </button>
          <p className="form-note">Use the public filters to inspect the same imported content set before generating.</p>
        </div>
        {state.message ? <p className={state.ok ? "form-success" : "form-error"}>{state.message}</p> : null}
      </form>
    </section>
  );
}
