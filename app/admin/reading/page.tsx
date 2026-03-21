import { redirect } from "next/navigation";

export default function AdminReadingRedirect() {
  redirect("/admin/content");
}
