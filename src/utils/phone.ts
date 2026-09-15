import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { Country } from '../data/countries';

// Best-effort E.164 normalization. Falls back to a plain "+<dial><digits>"
// concatenation when the digits typed don't form a number libphonenumber-js
// recognizes (e.g. a placeholder number used while testing this mockup).
export function normalizePhoneNumber(rawDigits: string, country: Country): string {
  if (!rawDigits) return '';
  const parsed = parsePhoneNumberFromString(rawDigits, country.iso2 as never);
  if (parsed) return parsed.number;
  return `+${country.dialCode}${rawDigits}`;
}
