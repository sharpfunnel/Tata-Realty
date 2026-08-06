/**
 * Lead-capture validation, shared by the React forms and the API route that
 * persists them. No `server-only` here on purpose — the whole point is that
 * the client and the server apply the same rules.
 *
 * The client checks are UX; the server checks are the boundary that actually
 * matters, since DevTools or a plain curl bypasses everything else.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Characters a phone field may contain before digits are counted. */
const PHONE_CHARS_RE = /^\+?[0-9\s\-()]+$/;

/**
 * Letters, marks, spaces, apostrophes, periods and hyphens.
 *
 * Deliberately `\p{L}\p{M}` rather than `A-Za-z`: this page runs Hindi copy
 * and advertises in Navi Mumbai, so a Devanagari name is an ordinary
 * submission, not junk. `\p{M}` covers the combining matras Devanagari needs.
 */
const NAME_RE = /^[\p{L}\p{M}\s'.-]{2,}$/u;

/** Digits required, matching the 10-digit Indian mobile the form asks for. */
export const PHONE_DIGITS = 10;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function isValidPhone(value: string): boolean {
  const trimmed = value.trim();
  if (!PHONE_CHARS_RE.test(trimmed)) return false;
  return trimmed.replace(/\D/g, "").length === PHONE_DIGITS;
}

export function isValidName(value: string): boolean {
  const trimmed = value.trim();
  if (!NAME_RE.test(trimmed)) return false;
  // A name made only of punctuation and spaces passes the character class but
  // is not a name — require at least one actual letter.
  return /\p{L}/u.test(trimmed);
}

/** Live-typing filter: strips disallowed characters and caps the digit count. */
export function sanitizePhoneInput(value: string): string {
  const cleaned = value.replace(/[^0-9\s\-+()]/g, "");

  let digits = 0;
  let result = "";
  for (const char of cleaned) {
    if (char >= "0" && char <= "9") {
      digits += 1;
      if (digits > PHONE_DIGITS) continue;
    }
    result += char;
  }
  return result;
}

/** Live-typing filter: letters, marks, spaces, apostrophes, periods, hyphens. */
export function sanitizeNameInput(value: string): string {
  return value.replace(/[^\p{L}\p{M}\s'.-]/gu, "");
}
