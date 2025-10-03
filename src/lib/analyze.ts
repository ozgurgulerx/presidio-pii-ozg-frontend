import { maskText } from "./masking";
import type {
  Analysis,
  BackendAnalysis,
  BackendEntity,
  BackendTrace,
  Finding,
  FindingType,
  RiskLevel,
  TraceStep,
} from "./types";

const ANALYZE_URL = process.env.NEXT_PUBLIC_ANALYZE_URL ?? "http://localhost:8000/analyze";
const REQUEST_TIMEOUT_MS = 30_000;

const entityTypeMap: Record<string, FindingType> = {
  PERSON: "Name",
  EMAIL_ADDRESS: "Email",
  PHONE_NUMBER: "Phone",
  CREDIT_CARD: "CreditCard",
  IBAN: "IBAN",
  LOCATION: "Address",
  DATE_TIME: "DOB",
  ORGANIZATION: "Other",
  US_BANK_NUMBER: "Other",
  IP_ADDRESS: "Other",
};

const weightMap: Record<FindingType, number> = {
  Email: 12,
  Phone: 10,
  NationalID: 25,
  IBAN: 18,
  CreditCard: 28,
  Name: 6,
  Address: 8,
  DOB: 10,
  Other: 5,
};

const riskFromScore = (score: number): RiskLevel => {
  if (score >= 65) return "high";
  if (score >= 25) return "medium";
  return "low";
};

const mapEntityType = (entityType: string): FindingType =>
  entityTypeMap[entityType] ?? "Other";

const confidenceToPercentage = (score: number) =>
  Math.max(0, Math.min(100, Number((score * 100).toFixed(1))));

const weightForType = (type: FindingType) => weightMap[type] ?? 5;

const toTrace = (events: BackendTrace[] | undefined): TraceStep[] =>
  (events ?? []).map((event, index) => ({
    stage: event.stage || `event-${index + 1}`,
    detail: event.detail,
    elapsedMs: Number(event.elapsed_ms?.toFixed?.(2) ?? event.elapsed_ms ?? 0),
  }));

const buildFindings = (entities: BackendEntity[]): Finding[] =>
  entities.map((entity, index) => {
    const type = mapEntityType(entity.type);
    const source = entity.source === "llm" ? "llm" : "presidio";
    const explanation =
      entity.explanation ??
      (source === "llm"
        ? `LLM fallback predicted ${type}`
        : `Presidio recognizer predicted ${type}`);
    return {
      id: `${type}-${index}-${Math.round(entity.score * 1000)}`,
      type,
      value: entity.text,
      start: entity.start,
      end: entity.end,
      confidence: confidenceToPercentage(entity.score),
      source,
      explanation,
    };
  });

const riskScoreFromFindings = (findings: Finding[]) =>
  Math.min(100, findings.reduce((acc, item) => acc + weightForType(item.type), 0));

const computeMaskedText = (source: string, findings: Finding[], fallback?: string | null) => {
  if (fallback && fallback.length > 0) {
    return fallback;
  }
  const maskAll = new Set(findings.map((item) => item.id));
  return maskText(source, findings, maskAll);
};

const toAnalysis = (payload: BackendAnalysis, source: string): Analysis => {
  const findings = buildFindings(payload.entities);
  const riskScore = riskScoreFromFindings(findings);
  const maskedText = computeMaskedText(source, findings, payload.redacted_text);
  const distinctTypes = new Set(findings.map((item) => item.type)).size;
  const trace = toTrace(payload.trace);

  return {
    riskScore,
    riskLevel: riskFromScore(riskScore),
    findings,
    maskedText,
    distinctTypes,
    trace,
  };
};

const requestAnalysis = async (text: string): Promise<BackendAnalysis> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(ANALYZE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status ${response.status}`);
    }

    const data = (await response.json()) as BackendAnalysis;
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Analysis request timed out");
    }
    throw new Error("Unable to analyze text");
  } finally {
    clearTimeout(timeout);
  }
};

export async function analyzeText(text: string): Promise<Analysis> {
  const trimmed = text ?? "";
  if (trimmed.trim().length === 0) {
    return {
      riskScore: 0,
      riskLevel: "low",
      findings: [],
      maskedText: "",
      distinctTypes: 0,
      trace: [],
    };
  }

  const backendResult = await requestAnalysis(trimmed);
  return toAnalysis(backendResult, trimmed);
}
