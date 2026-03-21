"use client";

import { useActionState } from "react";
import { moderateCommentAction, type ActionState } from "@/lib/actions";

const initialState: ActionState = {
  ok: false,
  message: ""
};

export function CommentModerationControls({ commentId }: { commentId: string }) {
  const [state, formAction, pending] = useActionState(moderateCommentAction, initialState);

  return (
    <form action={formAction} className="moderation-form">
      <input type="hidden" name="commentId" value={commentId} />
      <button type="submit" name="status" value="approved" disabled={pending}>
        Approve
      </button>
      <button type="submit" name="status" value="hidden" disabled={pending}>
        Hide
      </button>
      <button type="submit" name="status" value="deleted" disabled={pending}>
        Delete
      </button>
      {state.message ? <p className={state.ok ? "form-success" : "form-error"}>{state.message}</p> : null}
    </form>
  );
}