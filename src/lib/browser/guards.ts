import type { Action, PageElement } from "./types";

/** Host must equal an allowed domain or be a subdomain of it. Default-deny: empty allowlist allows nothing. */
export function hostAllowed(url: string, allow: string[]): boolean {
  let host: string;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    host = u.hostname.toLowerCase();
  } catch {
    return false;
  }
  return allow.some((d) => host === d.toLowerCase() || host.endsWith("." + d.toLowerCase()));
}

const SENSITIVE = /\b(buy|purchase|pay|checkout|place order|subscribe|delete|remove account|confirm|send|publish|post|upgrade|billing|password|otp|cvv|card number)\b/i;

/** True when a human must approve BEFORE the action runs. */
export function needsConfirm(a: Action, el?: PageElement): boolean {
  if (a.type === "type") {
    if (el?.type === "password") return true;
    if (/\b(password|otp|cvv|card)\b/i.test(el?.name ?? "")) return true;
  }
  if ((a.type === "click" || a.type === "type" || a.type === "select") && el) return SENSITIVE.test(el.name);
  return false;
}

const INJECTION = /(ignore (all|any|previous|prior) (instructions|rules)|disregard the above|you are now|system prompt|reveal your (prompt|instructions)|<\/?untrusted_data>)/i;
export const looksInjected = (text: string): boolean => INJECTION.test(text);

export function redact(text: string): string {
  return text.replace(/\b(sk|tvly|exa|nvapi|gsk)[-_][A-Za-z0-9_-]{12,}\b/g, "[REDACTED]");
}
