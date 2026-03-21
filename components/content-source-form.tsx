"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/actions";
import { SOURCE_TYPES } from "@/lib/content";
import type { Topic } from "@/lib/types";

const initialState: ActionState = { ok: false, message: "" };

interface ContentSourceFormProps {
  topics: Topic[];
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
}

export function ContentSourceForm({ topics, action }: ContentSourceFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <section className="card admin-panel">
      <div className="section-heading">
        <p className="eyebrow">Sources</p>
        <h2>Add a source or feed</h2>
        <p className="section-description">Register a blog index or feed URL. Imported items will flow into the same content workspace and summary builder.</p>
      </div>
      <form action={formAction} className="admin-form">
        <label>
          <span>Source name</span>
          <input name="name" placeholder="Databricks Blog" required />
        </label>
        <label>
          <span>Source URL</span>
          <input name="sourceUrl" type="url" placeholder="https://www.databricks.com/blog" required />
        </label>
        <label>
          <span>Feed URL</span>
          <input name="feedUrl" type="url" placeholder="Optional RSS / Atom URL" />
        </label>
        <label>
          <span>Source type</span>
          <select name="sourceType" defaultValue="blog-index">
            {SOURCE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Default topic</span>
          <select name="defaultTopicSlug" defaultValue="">
            <option value="">No default topic</option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.slug}>
                {topic.name}
              </option>
            ))}
          </select>
        </label>
        <div className="form-actions">
          <button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save source"}
          </button>
          <p className="form-note">If no feed URL is provided, the importer will try feed discovery first and then fall back to blog-index scraping.</p>
        </div>
        {state.message ? <p className={state.ok ? "form-success" : "form-error"}>{state.message}</p> : null}
      </form>
    </section>
  );
}
