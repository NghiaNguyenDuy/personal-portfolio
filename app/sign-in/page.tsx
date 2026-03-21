import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AuthForms } from "@/components/auth-forms";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in as admin or register a reader account to comment on articles."
};

export default async function SignInPage() {
  const user = await getSessionUser();

  if (user) {
    redirect(user.role === "admin" ? "/admin" : "/");
  }

  return (
    <section className="section">
      <div className="shell">
        <div className="section-heading">
          <p className="eyebrow">Authentication</p>
          <h1>Sign in for admin access or create a reader account.</h1>
          <p className="section-description">
            Admin credentials come from `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Reader accounts are created in the database.
          </p>
        </div>
        <AuthForms />
      </div>
    </section>
  );
}