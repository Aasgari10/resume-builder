// Iranian mobile number normalization to the canonical 09xxxxxxxxx form.
// Accepts 09121234567, 9121234567, +989121234567, 00989121234567, and Persian/Arabic digits.

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Converts Persian and Arabic-Indic digits to ASCII digits. */
export function toLatinDigits(input: string): string {
  return input.replace(/[۰-۹٠-٩]/g, (ch) => {
    const p = PERSIAN_DIGITS.indexOf(ch);
    return String(p >= 0 ? p : ARABIC_DIGITS.indexOf(ch));
  });
}

/** Returns the normalized number, or null if it is not a valid Iranian mobile number. */
export function normalizeIranPhone(input: string): string | null {
  let digits = toLatinDigits(input).replace(/[\s\-()]/g, "");

  if (digits.startsWith("+98")) digits = "0" + digits.slice(3);
  else if (digits.startsWith("0098")) digits = "0" + digits.slice(4);
  else if (digits.startsWith("98") && digits.length === 12) digits = "0" + digits.slice(2);
  else if (digits.startsWith("9") && digits.length === 10) digits = "0" + digits;

  return /^09\d{9}$/.test(digits) ? digits : null;
}
