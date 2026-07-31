import { redirect } from "next/navigation";

// /admin is not a page of its own — sessions is the default overview.
export default function AdminIndexPage() {
  redirect("/admin/sessions");
}
