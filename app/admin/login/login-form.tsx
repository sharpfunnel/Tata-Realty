"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

const field =
  "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-[#ff7a1a]/60 focus:bg-white/[0.06] focus:ring-4 focus:ring-[#ff7a1a]/15";

export default function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-white/10 bg-[#121214] p-6 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.9)]"
    >
      {/* Where proxy.ts intercepted them; validated server-side before use. */}
      {next && <input type="hidden" name="next" value={next} />}

      <label
        htmlFor="email"
        className="mb-2 block text-[11px] font-medium tracking-wider text-white/45 uppercase"
      >
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="username"
        placeholder="admin@example.com"
        className={field}
      />

      <label
        htmlFor="password"
        className="mt-4 mb-2 block text-[11px] font-medium tracking-wider text-white/45 uppercase"
      >
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
        placeholder="••••••••"
        className={field}
      />

      {state.error && (
        <p role="alert" className="mt-4 text-sm text-red-400">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-lg bg-[#ff7a1a] py-2.5 text-sm font-semibold text-black transition hover:bg-[#ff8c3a] focus-visible:ring-4 focus-visible:ring-[#ff7a1a]/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
