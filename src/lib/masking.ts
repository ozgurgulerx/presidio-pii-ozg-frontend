import type { Finding, FindingType } from "./types";

const MASK_LABELS: Record<FindingType, string> = {
  Email: "[E-posta]",
  Phone: "[Telefon]",
  NationalID: "[TC Kimlik]",
  IBAN: "[IBAN]",
  CreditCard: "[Kredi Kartı]",
  Name: "[Ad Soyad]",
  Address: "[Adres]",
  DOB: "[Doğum Tarihi]",
  Other: "[PII]",
};

/** Returns a masked token for the provided finding type. */
export const maskValue = (type: FindingType) => MASK_LABELS[type];

/**
 * Produces a masked text representation by replacing the values whose IDs exist in the provided set.
 * The function keeps index calculations stable by processing findings from left to right.
 */
export function maskText(
  original: string,
  findings: Finding[],
  idsToMask: Set<string>,
) {
  if (original.trim().length === 0 || idsToMask.size === 0) {
    return original;
  }

  const ordered = [...findings].sort((a, b) => a.start - b.start);
  let cursor = 0;
  const parts: string[] = [];

  for (const finding of ordered) {
    if (cursor < finding.start) {
      parts.push(original.slice(cursor, finding.start));
    }

    const shouldMask = idsToMask.has(finding.id);
    parts.push(shouldMask ? maskValue(finding.type) : finding.value);
    cursor = finding.end;
  }

  if (cursor < original.length) {
    parts.push(original.slice(cursor));
  }

  return parts.join("");
}
