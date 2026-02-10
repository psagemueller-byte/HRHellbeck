/**
 * Input-Sanitisierung und Validierung
 *
 * Schützt gegen XSS, Injection und unerwünschte Eingaben.
 * Alle User-Inputs sollten durch diese Funktionen laufen,
 * bevor sie gespeichert oder an APIs gesendet werden.
 */

const HTML_TAG_REGEX = /<[^>]*>/g;
const SCRIPT_REGEX = /<script[\s\S]*?>[\s\S]*?<\/script>/gi;
const EVENT_HANDLER_REGEX = /on\w+\s*=\s*["'][^"']*["']/gi;
const JAVASCRIPT_URI_REGEX = /javascript\s*:/gi;

export function sanitizeString(input: string): string {
  return input
    .replace(SCRIPT_REGEX, "")
    .replace(EVENT_HANDLER_REGEX, "")
    .replace(JAVASCRIPT_URI_REGEX, "")
    .replace(HTML_TAG_REGEX, "")
    .trim();
}

export function sanitizeAndLimit(input: string, maxLength: number): string {
  return sanitizeString(input).slice(0, maxLength);
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email) && email.length <= 254;
}

const PHONE_REGEX = /^[+]?[\d\s\-().]{0,30}$/;

export function isValidPhone(phone: string): boolean {
  return PHONE_REGEX.test(phone);
}

const ZIP_REGEX = /^[\d\s\-A-Za-z]{0,10}$/;

export function isValidZipCode(zip: string): boolean {
  return ZIP_REGEX.test(zip);
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDate(dateStr: string): boolean {
  if (!DATE_REGEX.test(dateStr)) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

const VALID_VACATION_TYPES = ["urlaub", "sonderurlaub", "unbezahlt"] as const;
export type VacationType = (typeof VALID_VACATION_TYPES)[number];

export function isValidVacationType(type: string): type is VacationType {
  return (VALID_VACATION_TYPES as readonly string[]).includes(type);
}

export function encodePathParam(param: string): string {
  return encodeURIComponent(param).replace(/\.\./g, "");
}
