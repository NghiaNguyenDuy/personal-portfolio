"use client";

import { useActionState } from "react";
import { createCommentAction, type ActionState } from "@/lib/actions";

const initialState: ActionState = {
  ok: false,
  message: ""
};

export function CommentForm({ postSlug }: { postSlug: string }) {
  const [state, formAction, pending] = useActionState(createCommentAction, initialState);

  return (
    <form action={formAction} className="card admin-form comment-form-shell">
      <input type="hidden" name="postSlug" value={postSlug} />
      <div className="comment-form-head">
        <p className="eyebrow">Write</p>
        <h3>Leave a comment</h3>
        <p className="form-note">Reader comments go through moderation before they appear publicly.</p>
      </div>

      <label>
        <span>Your comment</span>
        <textarea name="body" rows={5} placeholder="Share a clear, thoughtful response." required />
      </label>

      <div className="form-actions">
        <button type="submit" disabled={pending}>
          {pending ? "Sending..." : "Post comment"}
        </button>
      </div>

      {state.message ? <p className={state.ok ? "form-success" : "form-error"}>{state.message}</p> : null}
    </form>
  );
}
