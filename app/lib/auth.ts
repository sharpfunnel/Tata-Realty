import "server-only";

import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "tr_admin";

export type AdminSession = {
  userId?: string;
  email?: string;
};

function sessionPassword() {
  const password = process.env.ADMIN_SESSION_SECRET;

  if (!password || password.length < 32) {
    throw new Error(
      "ADMIN_SESSION_SECRET must be set to a random string of at least 32 characters.",
    );
  }

  return password;
}

export function sessionOptions(): SessionOptions {
  return {
    password: sessionPassword(),
    cookieName: ADMIN_COOKIE,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 hours
    },
  };
}

/**
 * Reads the encrypted admin session from the request cookies.
 * `proxy.ts` only checks that a cookie exists; this is the real verification.
 */
export async function getAdminSession() {
  const cookieStore = await cookies();
  return getIronSession<AdminSession>(cookieStore, sessionOptions());
}

export async function requireAdmin() {
  const session = await getAdminSession();
  return session.userId ? session : null;
}
