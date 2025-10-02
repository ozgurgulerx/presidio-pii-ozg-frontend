export type Severity = "low" | "medium" | "high";

export interface PiiPattern {
  id: string;
  label: string;
  severity: Severity;
  description: string;
  regex: RegExp;
}

export interface PiiMatch {
  id: string;
  type: string;
  label: string;
  severity: Severity;
  description: string;
  match: string;
  index: number;
}

const patterns: PiiPattern[] = [
  {
    id: "email",
    label: "E-posta",
    severity: "medium",
    description: "E-posta adresleri",
    regex:
      /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}(?:\.[a-z]{2,})?\b/gi,
  },
  {
    id: "phone",
    label: "Telefon Numarası",
    severity: "medium",
    description: "Telefon numaraları",
    regex:
      /(?:(?:\+|00)?(?:\d{1,3}))?[\s-]?(?:\(?\d{3}\)?)[\s-]?\d{3}[\s-]?\d{2,4}/gi,
  },
  {
    id: "credit-card",
    label: "Kredi Kartı",
    severity: "high",
    description: "Muhtemel kredi kartı numaraları",
    regex:
      /\b(?:\d[ -]*?){13,19}\b/g,
  },
  {
    id: "tc-kimlik",
    label: "TC Kimlik No",
    severity: "high",
    description: "Türkiye Cumhuriyeti kimlik numarası formatı",
    regex: /\b[1-9]\d{10}\b/g,
  },
  {
    id: "iban",
    label: "IBAN",
    severity: "high",
    description: "IBAN formatına uyan numaralar",
    regex: /\bTR\d{2}\s?(?:\d{4}\s?){5}\d{2}\b/gi,
  },
  {
    id: "ip-address",
    label: "IP Adresi",
    severity: "low",
    description: "IPv4 adresleri",
    regex:
      /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g,
  },
  {
    id: "date",
    label: "Doğum Tarihi",
    severity: "medium",
    description: "Tarih formatına benzeyen ifadeler",
    regex:
      /\b(?:\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4}|\d{4}-\d{2}-\d{2})\b/g,
  },
];

const severityWeight: Record<Severity, number> = {
  low: 1,
  medium: 3,
  high: 6,
};

export interface AnalysisSummary {
  matches: PiiMatch[];
  riskScore: number;
  riskLevel: "Düşük" | "Orta" | "Yüksek";
  distinctTypes: number;
}

export function analyzeText(text: string): AnalysisSummary {
  const matches: PiiMatch[] = [];

  patterns.forEach((pattern) => {
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);

    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const value = match[0];

      if (!value) continue;

      if (
        pattern.id === "credit-card" &&
        !passesLuhn(value.replace(/[^\d]/g, ""))
      ) {
        continue;
      }

      matches.push({
        id: `${pattern.id}-${match.index}`,
        type: pattern.id,
        label: pattern.label,
        severity: pattern.severity,
        description: pattern.description,
        match: value,
        index: match.index,
      });
    }
  });

  const riskScore = matches.reduce(
    (acc, current) => acc + severityWeight[current.severity],
    0,
  );

  const hasHigh = matches.some((item) => item.severity === "high");
  const hasMedium = matches.some((item) => item.severity === "medium");

  const riskLevel: AnalysisSummary["riskLevel"] = hasHigh
    ? "Yüksek"
    : hasMedium
      ? "Orta"
      : matches.length > 0
        ? "Düşük"
        : "Düşük";

  const distinctTypes = new Set(matches.map((item) => item.type)).size;

  return {
    matches,
    riskScore,
    riskLevel,
    distinctTypes,
  };
}

function passesLuhn(cardNumber: string) {
  const sanitized = cardNumber.replace(/\D/g, "");
  if (sanitized.length < 12) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = sanitized.length - 1; i >= 0; i -= 1) {
    let digit = parseInt(sanitized.charAt(i), 10);

    if (Number.isNaN(digit)) {
      return false;
    }

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}
