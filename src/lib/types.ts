// Shared domain types used by the analyzer and UI layers.
export type BackendEntity = {
  type: string;
  text: string;
  start: number;
  end: number;
  score: number;
};

export type BackendAnalysis = {
  entities: BackendEntity[];
  has_pii: boolean;
  redacted_text?: string | null;
};

export type FindingType =
  | "Email"
  | "Phone"
  | "NationalID"
  | "IBAN"
  | "CreditCard"
  | "Name"
  | "Address"
  | "DOB"
  | "Other";

export type RiskLevel = "low" | "medium" | "high";

export type Finding = {
  id: string;
  type: FindingType;
  value: string;
  start: number;
  end: number;
  confidence: number;
};

export type Analysis = {
  riskScore: number;
  riskLevel: RiskLevel;
  findings: Finding[];
  maskedText: string;
  distinctTypes: number;
};
