"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminSession } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { rateLimit } from "../../lib/rate-limit";
import { clientIp } from "../../lib/request";

const credentials = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
});

/**
 * Only ever bounce back to an admin path on this origin. Without this a
 * crafted ?next=https://evil.example turns the login into an open redirect.
 */
function safeRedirect(value: FormDataEntryValue | null): string {
  const target = typeof value === "string" ? value : "";
  if (
    target.startsWith("/admin/") &&
    !target.startsWith("/admin/login") &&
    // Reject protocol-relative ("//host") and back-slash variants.
    !target.startsWith("/admin//") &&
    !target.includes("\\")
  ) {
    return target;
  }
  return "/admin/sessions";
}

export type LoginState = { error: string | null };

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  // Deliberately vague: never reveal whether the email exists.
  const invalid = { error: "Incorrect email or password." };

  if (!parsed.success) return invalid;

  // Throttle brute-force attempts per IP.
  const ip = await clientIp();
  if (!rateLimit(`login:${ip}`, { limit: 10, windowMs: 5 * 60_000 })) {
    return { error: "Too many attempts. Try again in a few minutes." };
  }

  const user = await prisma.adminUser.findUnique({
    where: { email: parsed.data.email },
  });

  if (!user) {
    // Equalise timing so a missing user is not faster than a wrong password.
    await bcrypt.compare(parsed.data.password, "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv");
    return invalid;
  }

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) return invalid;

  const session = await getAdminSession();
  session.userId = user.id;
  session.email = user.email;
  await session.save();

  redirect(safeRedirect(formData.get("next")));
}

export async function logout() {
  const session = await getAdminSession();
  session.destroy();
  redirect("/admin/login");
}
