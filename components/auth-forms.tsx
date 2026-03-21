"use client";

import { useActionState } from "react";
import { registerAction, signInAction, type ActionState } from "@/lib/actions";

const initialState: ActionState = {
  ok: false,
  message: ""
};

export function AuthForms() {
  const [signInState, signInFormAction, signingIn] = useActionState(signInAction, initialState);
  const [registerState, registerFormAction, registering] = useActionState(registerAction, initialState);

  return (
    <div className="admin-grid">
      <section className="card admin-panel">
        <div className="section-heading">
          <p className="eyebrow">Sign in</p>
          <h2>Return to your account</h2>
          <p className="section-description">Admins can manage content. Readers can join discussions.</p>
        </div>
        <form action={signInFormAction} className="admin-form">
          <label>
            <span>Email</span>
            <input type="email" name="email" placeholder="you@example.com" required />
          </label>
          <label>
            <span>Password</span>
            <input type="password" name="password" placeholder="At least 8 characters" required />
          </label>
          <div className="form-actions">
            <button type="submit" disabled={signingIn}>
              {signingIn ? "Signing in..." : "Sign in"}
            </button>
          </div>
          {signInState.message ? (
            <p className={signInState.ok ? "form-success" : "form-error"}>{signInState.message}</p>
          ) : null}
        </form>
      </section>

      <section className="card admin-panel">
        <div className="section-heading">
          <p className="eyebrow">Register</p>
          <h2>Create a reader account</h2>
          <p className="section-description">Reader accounts can comment on articles and join discussion threads.</p>
        </div>
        <form action={registerFormAction} className="admin-form">
          <label>
            <span>Name</span>
            <input type="text" name="name" placeholder="Your name" required />
          </label>
          <label>
            <span>Email</span>
            <input type="email" name="email" placeholder="you@example.com" required />
          </label>
          <label>
            <span>Password</span>
            <input type="password" name="password" placeholder="At least 8 characters" required />
          </label>
          <div className="form-actions">
            <button type="submit" disabled={registering}>
              {registering ? "Creating account..." : "Create account"}
            </button>
          </div>
          {registerState.message ? (
            <p className={registerState.ok ? "form-success" : "form-error"}>{registerState.message}</p>
          ) : null}
        </form>
      </section>
    </div>
  );
}