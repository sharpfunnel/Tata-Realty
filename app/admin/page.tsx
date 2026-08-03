import { redirect } from "next/navigation";

// /admin is not a page of its own — the overview dashboard is the landing tab.
export default function AdminIndexPage() {
  redirect("/admin/overview");
}
