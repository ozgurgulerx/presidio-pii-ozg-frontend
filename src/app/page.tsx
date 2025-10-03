"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, SVGProps } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  BadgeCheck,
  Copy,
  Download,
  FileJson,
  FileOutput,
  HelpCircle,
  Languages,
  Lock,
  ShieldAlert,
  ShieldCheck,
  ShieldHalf,
  Upload,
  X,
} from "lucide-react";

import { analyzeText } from "@/lib/analyze";
import { maskText, maskValue } from "@/lib/masking";
import { cn } from "@/lib/utils";
import { getDictionary, getOppositeLocale, type Locale } from "@/lib/i18n";
import type { Analysis, Finding, FindingType, RiskLevel } from "@/lib/types";

const TEXTAREA_STORAGE_KEY = "pii-app:input";
const PRIVACY_STORAGE_KEY = "pii-app:privacy";
const LOCALE_STORAGE_KEY = "pii-app:locale";
const IDLE_TIMEOUT = 20 * 60 * 1000;
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const DATA_REGION = "EU (Frankfurt)";

const riskPillStyles: Record<RiskLevel, string> = {
  low: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
  medium: "bg-amber-500/15 text-amber-200 border border-amber-500/30",
  high: "bg-rose-500/15 text-rose-200 border border-rose-500/30",
};

const riskTextStyles: Record<RiskLevel, string> = {
  low: "text-emerald-300",
  medium: "text-amber-300",
  high: "text-rose-300",
};

const typeBadgeStyles: Record<FindingType, string> = {
  Email: "bg-emerald-500/10 text-emerald-200 border border-emerald-500/20",
  Phone: "bg-sky-500/10 text-sky-200 border border-sky-500/20",
  NationalID: "bg-rose-500/10 text-rose-200 border border-rose-500/20",
  IBAN: "bg-sky-500/10 text-sky-200 border border-sky-500/20",
  CreditCard: "bg-rose-500/10 text-rose-200 border border-rose-500/20",
  Name: "bg-amber-500/10 text-amber-200 border border-amber-500/20",
  Address: "bg-amber-500/10 text-amber-200 border border-amber-500/20",
  DOB: "bg-emerald-500/10 text-emerald-200 border border-emerald-500/20",
  Other: "bg-slate-500/10 text-slate-200 border border-slate-500/20",
};

type Toast = {
  id: number;
  message: string;
};

const riskLabelMap: Record<Locale, Record<RiskLevel, string>> = {
  tr: {
    low: "Düşük",
    medium: "Orta",
    high: "Yüksek",
  },
  en: {
    low: "Low",
    medium: "Medium",
    high: "High",
  },
};

const findingLabels: Record<Locale, Record<FindingType, string>> = {
  tr: {
    Email: "E-posta",
    Phone: "Telefon",
    NationalID: "TC Kimlik",
    IBAN: "IBAN",
    CreditCard: "Kredi Kartı",
    Name: "Ad-Soyad",
    Address: "Adres",
    DOB: "Doğum Tarihi",
    Other: "Diğer",
  },
  en: {
    Email: "Email",
    Phone: "Phone",
    NationalID: "National ID",
    IBAN: "IBAN",
    CreditCard: "Credit Card",
    Name: "Name",
    Address: "Address",
    DOB: "Date of Birth",
    Other: "Other",
  },
};

export default function Home() {
  const [locale, setLocale] = useState<Locale>("tr");
  const dictionary = useMemo(() => getDictionary(locale), [locale]);
  const [input, setInput] = useState("");
  // Locale tag is used for consistent date/time formatting across browsers.
  const localeTag = locale === "tr" ? "tr-TR" : "en-US";
  const [privacyEnabled, setPrivacyEnabled] = useState<boolean>(true);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzedSource, setAnalyzedSource] = useState("");
  const [analysisTimestamp, setAnalysisTimestamp] = useState<Date | null>(null);
  const [manualMasked, setManualMasked] = useState<Set<string>>(new Set());
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [showTimeoutBanner, setShowTimeoutBanner] = useState(false);

  const helpRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const idleRef = useRef<number>(Date.now());
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Generate a stable session id only on the client to avoid SSR/CSR mismatch.
  const [sessionId, setSessionId] = useState<string>("");
  useEffect(() => {
    try {
      const key = "pii-session-id";
      let sid = sessionStorage.getItem(key);
      if (!sid) {
        sid = (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2);
        sessionStorage.setItem(key, sid);
      }
      setSessionId(sid);
    } catch {
      // If storage is unavailable, leave empty; UI will render a placeholder.
    }
  }, []);

  // Decide which findings should be masked based on privacy mode and manual overrides.
  const maskedSet = useMemo(() => {
    if (!analysis) return new Set<string>();
    if (privacyEnabled) {
      return new Set(analysis.findings.map((item) => item.id));
    }
    return manualMasked;
  }, [analysis, privacyEnabled, manualMasked]);

  // Render the masked text view for the analyst.
  const displayedMaskedText = useMemo(() => {
    if (!analysis) return "";
    return maskText(analyzedSource, analysis.findings, maskedSet);
  }, [analysis, analyzedSource, maskedSet]);

  // Clean text removes masked placeholders for downstream workflows.
  const cleanText = useMemo(() => {
    if (!analysis) return "";
    return displayedMaskedText.replace(/\[[^\]]+\]/g, "");
  }, [analysis, displayedMaskedText]);

  // Restore persisted user preferences on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedInput = window.localStorage.getItem(TEXTAREA_STORAGE_KEY);
    const storedPrivacy = window.localStorage.getItem(PRIVACY_STORAGE_KEY);
    const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY) as
      | Locale
      | null;

    if (storedInput) {
      setInput(storedInput);
    }
    if (storedPrivacy) {
      setPrivacyEnabled(storedPrivacy === "true");
    }
    if (storedLocale === "tr" || storedLocale === "en") {
      setLocale(storedLocale);
    }
  }, []);

  // Persist the textarea content between sessions.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TEXTAREA_STORAGE_KEY, input);
  }, [input]);

  // Persist privacy preference for future visits.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PRIVACY_STORAGE_KEY, String(privacyEnabled));
  }, [privacyEnabled]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }, [locale]);

  // Auto-resize the textarea for pasted content without scrollbars.
  useEffect(() => {
    const adjustHeight = () => {
      if (!textareaRef.current) return;
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    };
    adjustHeight();
  }, [input]);

  // Track user activity to raise the idle-session banner.
  useEffect(() => {
    const handleActivity = () => {
      idleRef.current = Date.now();
      setShowTimeoutBanner(false);
    };

    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "keydown",
      "mousedown",
      "scroll",
      "touchstart",
    ];

    events.forEach((event) => window.addEventListener(event, handleActivity));

    const interval = window.setInterval(() => {
      if (Date.now() - idleRef.current >= IDLE_TIMEOUT) {
        setShowTimeoutBanner(true);
      }
    }, 30000);

    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, handleActivity),
      );
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setHelpOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!helpRef.current) return;
      if (!helpRef.current.contains(event.target as Node)) {
        setHelpOpen(false);
      }
    };
    if (helpOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [helpOpen]);

  // Centralised toast helper for discrete status notifications.
  const showToast = (message: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    const id = Date.now();
    setToast({ id, message });
    toastTimerRef.current = setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 4000);
  };

  // Execute the mock analyzer and surface findings in the UI.
  const handleAnalyze = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      const result = await analyzeText(trimmed);
      setAnalysis(result);
      setAnalyzedSource(trimmed);
      setAnalysisTimestamp(new Date());
      setManualMasked(new Set());
      setFlagged(new Set());
      if (resultsRef.current) {
        const prefersReducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        resultsRef.current.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "start",
        });
      }
    } catch (error) {
      console.error(error);
      showToast(dictionary.toastAnalyzeFailed);
    } finally {
      setLoading(false);
    }
  };

  // Support uploading plain-text inputs for analysis.
  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      showToast(dictionary.errorLargeFile);
      event.target.value = "";
      return;
    }

    const allowedTypes = [
      "text/plain",
      "application/json",
      "text/csv",
      "application/octet-stream",
    ];
    const allowedExtensions = [".txt", ".csv", ".json"];
    const hasValidType =
      allowedTypes.includes(file.type) ||
      allowedExtensions.some((ext) => file.name.endsWith(ext));

    if (!hasValidType) {
      showToast(dictionary.toastCopyFailed);
      event.target.value = "";
      return;
    }

    const text = await file.text();
    setInput(text);
    event.target.value = "";
  };

  const togglePrivacy = () => {
    setPrivacyEnabled((prev) => !prev);
  };

  // Analysts can selectively mask individual findings when privacy mode is off.
  const handleMaskFinding = (finding: Finding) => {
    setManualMasked((prev) => {
      const next = new Set(prev);
      next.add(finding.id);
      return next;
    });
    showToast(dictionary.toastMasked);
  };

  // Utility to copy secure strings with graceful error handling.
  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      showToast(dictionary.toastCopied);
    } catch (error) {
      console.error(error);
      showToast(dictionary.toastCopyFailed);
    }
  };

  // Expose a structured export for downstream systems.
  const handleExportJson = () => {
    if (!analysis) return;
    const payload = {
      sessionId,
      locale,
      generatedAt: analysisTimestamp?.toISOString() ?? new Date().toISOString(),
      riskScore: analysis.riskScore,
      riskLevel: analysis.riskLevel,
      findings: analysis.findings,
      maskedText: displayedMaskedText,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pii-analysis-${sessionId}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(dictionary.toastJson);
  };

  // Generate a PDF snapshot for audit artefacts.
  const handleExportPdf = async () => {
    if (!analysis) return;
    const target = resultsRef.current;
    if (!target) return;

    const canvas = await html2canvas(target, {
      scale: window.devicePixelRatio > 1 ? 2 : 1,
      backgroundColor: "#0B1B2B",
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const margin = 32;
    const availableWidth = pageWidth - margin * 2;
    const imageHeight = (canvas.height * availableWidth) / canvas.width;

    pdf.setFillColor("#0B1B2B");
    pdf.rect(0, 0, pageWidth, pageHeight, "F");

    pdf.setTextColor("#E2E8F0");
    pdf.setFontSize(18);
    pdf.text(dictionary.pdfTitle, margin, margin + 8);

    pdf.setFontSize(11);
    pdf.text(
      `${dictionary.pdfRisk}: ${riskLabelMap[locale][analysis.riskLevel]} (${analysis.riskScore})`,
      margin,
      margin + 32,
    );
    pdf.text(`${dictionary.sessionId}: ${sessionId}`, margin, margin + 48);
    pdf.text(
      `${dictionary.pdfGenerated}: ${new Date()
        .toLocaleString(localeTag)} `,
      margin,
      margin + 64,
    );

    pdf.addImage(imgData, "PNG", margin, margin + 80, availableWidth, imageHeight);

    pdf.setFontSize(10);
    pdf.setTextColor(200);
    pdf.text(dictionary.pdfInternalUse, pageWidth / 2, pageHeight - 24, {
      align: "center",
    });

    pdf.save(`pii-analysis-${sessionId}.pdf`);
    showToast(dictionary.toastPdf);
  };

  // Derive contextual guidance aligned with the risk tier.
  const recommendation = useMemo(() => {
    if (!analysis) return "";
    if (analysis.riskLevel === "low") return dictionary.recommendationLow;
    if (analysis.riskLevel === "medium") return dictionary.recommendationMedium;
    return dictionary.recommendationHigh;
  }, [analysis, dictionary]);

  const findingsForDisplay = useMemo(() => analysis?.findings ?? [], [analysis]);

  // Toggle between the TR/EN dictionaries.
  const languageToggle = () => {
    setLocale((prev) => getOppositeLocale(prev));
  };

  // Reset the idle timer when the banner is dismissed.
  const dismissIdleBanner = () => {
    idleRef.current = Date.now();
    setShowTimeoutBanner(false);
  };

  const riskLabel = analysis ? riskLabelMap[locale][analysis.riskLevel] : "";

  const disableAnalyze = loading || !input.trim();

  return (
    <div className="min-h-screen bg-[#0B1B2B] text-slate-100">
      <div className="sticky top-0 z-40 border-b border-white/10 bg-[#0B1B2B]/85 backdrop-blur">
        <div className="mx-auto grid max-w-6xl grid-cols-[auto,1fr,auto] items-center gap-6 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10">
              <BadgeCheck className="h-5 w-5 text-emerald-300" aria-hidden />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-slate-200">
                {dictionary.bankName}
              </span>
              <span className="text-xs text-slate-400">{dictionary.bankDivision}</span>
            </div>
          </div>
          <div className="text-center text-sm font-semibold uppercase tracking-[0.08em] text-slate-200">
            PII Detection
          </div>
          <div className="flex items-center justify-end gap-6 text-sm">
            <button
              type="button"
              onClick={() => setHelpOpen((prev) => !prev)}
              className="relative flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-slate-200 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              aria-expanded={helpOpen}
              aria-haspopup="dialog"
            >
              <HelpCircle className="h-4 w-4" aria-hidden />
              {dictionary.helpLabel}
            </button>
            <button
              type="button"
              onClick={languageToggle}
              className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-slate-200 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              aria-label={dictionary.language}
            >
              <Languages className="h-4 w-4" aria-hidden />
              {locale.toUpperCase()}
            </button>
          </div>
        </div>
        {helpOpen ? (
          <div
            ref={helpRef}
            className="mx-auto max-w-6xl px-6 pb-4"
            role="dialog"
            aria-label={dictionary.helpLabel}
          >
            <div className="rounded-xl border border-white/10 bg-[#0F2236] p-4 text-sm text-slate-200 shadow-xl">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-300" aria-hidden />
                <p className="leading-6 text-slate-200">{dictionary.helpBody}</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-16 pt-10">
        {showTimeoutBanner ? (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertIcon className="h-4 w-4" aria-hidden />
                <span>{dictionary.idleWarning}</span>
              </div>
              <button
                type="button"
                onClick={dismissIdleBanner}
                className="rounded-lg border border-amber-500/40 px-3 py-1 text-amber-100 transition-colors hover:bg-amber-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              >
                {dictionary.idleDismiss}
              </button>
            </div>
          </div>
        ) : null}

        <section className="flex flex-col items-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
            <ShieldHalf className="h-6 w-6 text-emerald-200" aria-hidden />
          </div>
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl">
            {dictionary.heroTitle}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-300">
            {dictionary.heroSubtitle}
          </p>
        </section>

        <section className="rounded-xl border border-white/10 bg-[#0F2236] p-6 shadow-xl">
          <div className="flex flex-col gap-4">
            <label htmlFor="analysis-input" className="text-sm font-semibold text-slate-200">
              {dictionary.textareaLabel}
            </label>
            <textarea
              id="analysis-input"
              ref={textareaRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={dictionary.textareaPlaceholder}
              className="min-h-[200px] w-full resize-none rounded-xl border border-white/10 bg-slate-900/50 px-4 py-4 text-sm leading-6 text-slate-100 shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
              aria-describedby="analysis-helper"
            />
            <p id="analysis-helper" className="text-xs text-slate-400">
              {dictionary.textareaHelper}
            </p>
            <p className="text-xs text-slate-500">{dictionary.bugNote}</p>
            <div className="flex flex-col gap-3 border-t border-white/5 pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
                  <Lock className="h-3.5 w-3.5" aria-hidden />
                  {dictionary.localProcessing}
                </span>
                {privacyEnabled ? (
                  <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                    {dictionary.maskingActive}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-slate-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Upload className="h-4 w-4" aria-hidden />
                  {dictionary.fileUpload}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.csv,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => setInput("")}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-slate-200 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                >
                  <X className="h-4 w-4" aria-hidden />
                  {dictionary.clear}
                </button>
                <button
                  type="button"
                  onClick={togglePrivacy}
                  disabled
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-slate-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
                  role="switch"
                  aria-checked={privacyEnabled}
                >
                  <ShieldAlert className="h-4 w-4" aria-hidden />
                  {dictionary.privacyToggle}
                </button>
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={disableAnalyze}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-medium text-slate-900 transition-all duration-150 ease-out hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:cursor-not-allowed disabled:bg-emerald-500/40 disabled:text-slate-400"
                >
                  {loading ? (
                    <span>{dictionary.analyzeLoading}</span>
                  ) : (
                    <span>{dictionary.analyzeCta}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section
          ref={resultsRef}
          aria-live="polite"
          className="space-y-6"
          id="results-section"
        >
          {analysis ? (
            <>
              <div className="rounded-xl border border-white/10 bg-[#0F2236] p-6 shadow-xl">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-2">
                    <span className="text-sm text-slate-300">{dictionary.riskSummary}</span>
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
                          riskPillStyles[analysis.riskLevel],
                        )}
                      >
                        {riskLabel}
                      </span>
                      <span className="text-3xl font-semibold text-slate-50">
                        {analysis.riskScore}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300">{recommendation}</p>
                    {analysis.credentialAlert ? (
                      <div className="mt-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
                        {dictionary.credentialAlert}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex gap-6 text-sm text-slate-200">
                    <Metric
                      label={dictionary.findingsCount}
                      value={analysis.findings.length.toString()}
                    />
                    <Metric
                      label={dictionary.typesCount}
                      value={analysis.distinctTypes.toString()}
                    />
                  </div>
                </div>
                <div className="mt-6 h-2 rounded-full bg-slate-800">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all duration-150 ease-out",
                      analysis.riskLevel === "low"
                        ? "bg-emerald-500"
                        : analysis.riskLevel === "medium"
                          ? "bg-amber-500"
                          : "bg-rose-500",
                    )}
                    style={{ width: `${analysis.riskScore}%` }}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0F1F2A] p-6 shadow-xl">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-100">
                    {dictionary.findingsHeading}
                  </h2>
                  <span className="text-xs text-slate-400">
                    {analysis.findings.length} · {riskLabel}
                  </span>
                </div>
                {findingsForDisplay.length === 0 ? (
                  <div className="mt-6 rounded-xl border border-white/10 bg-[#0B1B2B] px-4 py-10 text-center text-sm text-slate-300">
                    <ShieldCheck className="mx-auto mb-3 h-6 w-6 text-emerald-300" aria-hidden />
                    {dictionary.findingsEmpty}
                  </div>
                ) : (
                  <ul className="mt-6 space-y-4">
                    {findingsForDisplay.map((finding) => {
                      const masked = maskedSet.has(finding.id);
                      const label = findingLabels[locale][finding.type];
                      const sourceLabel =
                        finding.source === "llm"
                          ? dictionary.sourceLLM
                          : dictionary.sourcePresidio;
                      const sourceBadgeClass =
                        finding.source === "llm"
                          ? "bg-violet-500/10 text-violet-200 border border-violet-500/20"
                          : "bg-emerald-500/10 text-emerald-200 border border-emerald-500/20";
                      return (
                        <li
                          key={finding.id}
                          className="rounded-xl border border-white/10 bg-[#0F2236]/80 p-4"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex flex-1 flex-col gap-3">
                              <div className="flex flex-wrap items-center gap-3">
                                <span
                                  className={cn(
                                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
                                    typeBadgeStyles[finding.type],
                                  )}
                                >
                                  {label}
                                </span>
                                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                                  {dictionary.confidence}: {finding.confidence}%
                                </span>
                                <span
                                  className={cn(
                                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
                                    sourceBadgeClass,
                                  )}
                                >
                                  {sourceLabel}
                                </span>
                                {flagged.has(finding.id) ? (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-200">
                                    <ShieldAlert className="h-3 w-3" aria-hidden />
                                    Review
                                  </span>
                                ) : null}
                              </div>
                              <p className="text-sm leading-6 text-slate-200">
                                {masked ? maskValue(finding.type) : finding.value}
                              </p>
                              <Snippet
                                source={analyzedSource}
                                finding={finding}
                                masked={masked}
                              />
                              <p className="text-xs text-slate-300">
                                <span className="font-medium text-slate-200">
                                  {dictionary.explanation}:
                                </span>{" "}
                                {finding.explanation}
                              </p>
                            </div>
                            <div className="flex flex-col gap-2 text-xs">
                              <button
                                type="button"
                                onClick={() => handleMaskFinding(finding)}
                                disabled={masked}
                                className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-slate-200 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <ShieldCheck className="h-4 w-4" aria-hidden />
                                {dictionary.maskAction}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopy(finding.value)}
                                className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-slate-200 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                              >
                                <Copy className="h-4 w-4" aria-hidden />
                                {dictionary.copyValue}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setFlagged((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(finding.id)) {
                                      next.delete(finding.id);
                                    } else {
                                      next.add(finding.id);
                                    }
                                    return next;
                                  })
                                }
                                className={cn(
                                  "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
                                  flagged.has(finding.id)
                                    ? "border-amber-500/50 bg-amber-500/10 text-amber-100"
                                    : "border-white/10 hover:bg-white/10",
                                )}
                              >
                                <ShieldAlert className="h-4 w-4" aria-hidden />
                                {dictionary.flagForReview}
                              </button>
                            </div>
                          </div>
                          <div className="mt-4 h-1.5 rounded-full bg-slate-800">
                            <div
                              className="h-1.5 rounded-full bg-sky-400"
                              style={{ width: `${finding.confidence}%` }}
                              role="progressbar"
                              aria-valuenow={finding.confidence}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0F1F2A] p-6 shadow-xl">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-100">
                    {dictionary.traceHeading}
                  </h2>
                  <span className="text-xs text-slate-400">
                    {analysis.trace.length}
                  </span>
                </div>
                {analysis.trace.length === 0 ? (
                  <div className="mt-6 rounded-xl border border-white/10 bg-[#0B1B2B] px-4 py-8 text-center text-sm text-slate-300">
                    {dictionary.traceEmpty}
                  </div>
                ) : (
                  <ol className="mt-6 space-y-4 text-sm text-slate-200">
                    {analysis.trace.map((event, idx) => (
                      <li
                        key={`${event.stage}-${idx}`}
                        className="rounded-lg border border-white/10 bg-[#0F2236]/80 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="font-medium text-slate-100">
                            {event.stage}
                          </div>
                          <span className="text-xs text-slate-400">
                            {event.elapsedMs.toFixed(2)} ms
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-300">{event.detail}</p>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0F2236] p-6 shadow-xl">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-slate-100">
                      {dictionary.maskedOutputHeading}
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleCopy(displayedMaskedText)}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-slate-200 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                    >
                      <Copy className="h-4 w-4" aria-hidden />
                      {dictionary.copyMasked}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">{dictionary.maskedOutputHelper}</p>
                </div>
                <textarea
                  value={displayedMaskedText}
                  readOnly
                  className="mt-4 h-48 w-full resize-none rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-slate-200 focus:outline-none"
                />
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handleExportPdf}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-slate-200 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  >
                    <FileOutput className="h-4 w-4" aria-hidden />
                    {dictionary.exportPdf}
                  </button>
                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-slate-200 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  >
                    <FileJson className="h-4 w-4" aria-hidden />
                    {dictionary.exportJson}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(cleanText)}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-slate-200 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  >
                    <Download className="h-4 w-4" aria-hidden />
                    {dictionary.copyClean}
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </section>
      </main>

      <section className="border-t border-white/10 bg-[#0F1F2A]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <Lock className="h-4 w-4 text-emerald-300" aria-hidden />
            <span>{dictionary.complianceText}</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span>
              {dictionary.sessionId}: <span className="text-slate-200" suppressHydrationWarning>{sessionId || "-"}</span>
            </span>
            <span>
              {dictionary.timestamp}: <span className="text-slate-200">{analysisTimestamp ? analysisTimestamp.toLocaleString(localeTag) : "-"}</span>
            </span>
            <span>
              {dictionary.region}: <span className="text-slate-200">{DATA_REGION}</span>
            </span>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#0B1B2B]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <a href="#" className="transition-colors hover:text-slate-100">
              {dictionary.footerNotice}
            </a>
            <a href="#" className="transition-colors hover:text-slate-100">
              {dictionary.footerPrivacy}
            </a>
            <a href="#" className="transition-colors hover:text-slate-100">
              {dictionary.footerTerms}
            </a>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
              {dictionary.statusOperational}
            </span>
            <span className="text-slate-500">v1.0.0 · build {sessionId ? sessionId.slice(0, 8) : "-"}</span>
          </div>
        </div>
      </footer>

      {toast ? (
        <div className="pointer-events-none fixed bottom-6 right-6 z-50">
          <div className="pointer-events-auto rounded-xl border border-white/10 bg-[#0F2236] px-4 py-3 text-sm text-slate-200 shadow-xl">
            {toast.message}
          </div>
        </div>
      ) : null}
    </div>
  );
}

type MetricProps = {
  label: string;
  value: string;
};

function Metric({ label, value }: MetricProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-xl font-semibold text-slate-50">{value}</span>
    </div>
  );
}

type SnippetProps = {
  source: string;
  finding: Finding;
  masked: boolean;
};

/** Extracts a contextual snippet around the finding for analyst review. */
function Snippet({ source, finding, masked }: SnippetProps) {
  if (!source) return null;
  const start = Math.max(finding.start - 24, 0);
  const end = Math.min(finding.end + 24, source.length);
  const before = source.slice(start, finding.start);
  const focus = masked ? maskValue(finding.type) : finding.value;
  const after = source.slice(finding.end, end);

  return (
    <p className="text-xs leading-6 text-slate-400">
      <span className="text-slate-500">…{before}</span>
      <span className={cn("mx-1 rounded px-1 py-0.5", masked ? riskTextStyles.high : "text-slate-100")}>{focus}</span>
      <span className="text-slate-500">{after}…</span>
    </p>
  );
}

function AlertIcon(props: SVGProps<SVGSVGElement>) {
  return <ShieldAlert {...props} />;
}
