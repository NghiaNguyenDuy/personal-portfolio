"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/actions";

interface AdminFormProps {
  title: string;
  description: string;
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel?: string;
  fields: Array<{
    name: string;
    label: string;
    as?: "input" | "textarea";
    type?: string;
    placeholder?: string;
    defaultValue?: string | number;
    required?: boolean;
  }>;
}

const initialState: ActionState = { ok: false, message: "" };

export function AdminForm({ title, description, action, fields, submitLabel }: AdminFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <section className="card admin-panel">
      <div className="section-heading">
        <p className="eyebrow">Admin form</p>
        <h2>{title}</h2>
        <p className="section-description">{description}</p>
      </div>
      <form action={formAction} className="admin-form">
        {fields.map((field) => (
          <label key={field.name}>
            <span>{field.label}</span>
            {field.as === "textarea" ? (
              <textarea
                name={field.name}
                rows={6}
                placeholder={field.placeholder}
                defaultValue={String(field.defaultValue ?? "")}
                required={field.required ?? true}
              />
            ) : (
              <input
                type={field.type ?? "text"}
                name={field.name}
                placeholder={field.placeholder}
                defaultValue={String(field.defaultValue ?? "")}
                required={field.required ?? true}
              />
            )}
          </label>
        ))}
        <div className="form-actions">
          <button type="submit" disabled={pending}>
            {pending ? "Validating..." : submitLabel ?? "Save draft"}
          </button>
          <p className="form-note">Use the required fields for the default workflow. Optional fields override generated values.</p>
        </div>
        {state.message ? <p className={state.ok ? "form-success" : "form-error"}>{state.message}</p> : null}
      </form>
    </section>
  );
}
