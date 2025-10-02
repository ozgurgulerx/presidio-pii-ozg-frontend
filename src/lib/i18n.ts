// Locale dictionary for TR/EN UI copy.
export type Locale = "tr" | "en";

type Dictionary = {
  heroTitle: string;
  heroSubtitle: string;
  textareaLabel: string;
  textareaPlaceholder: string;
  textareaHelper: string;
  analyzeCta: string;
  analyzeLoading: string;
  clear: string;
  fileUpload: string;
  privacyToggle: string;
  localProcessing: string;
  maskingActive: string;
  resultsHeading: string;
  riskSummary: string;
  riskScore: string;
  findingsCount: string;
  typesCount: string;
  recommendationLow: string;
  recommendationMedium: string;
  recommendationHigh: string;
  findingsHeading: string;
  findingsEmpty: string;
  maskAction: string;
  copyValue: string;
  flagForReview: string;
  confidence: string;
  maskedOutputHeading: string;
  maskedOutputHelper: string;
  copyMasked: string;
  exportPdf: string;
  exportJson: string;
  copyClean: string;
  complianceText: string;
  sessionId: string;
  timestamp: string;
  region: string;
  helpLabel: string;
  helpBody: string;
  language: string;
  footerPrivacy: string;
  footerTerms: string;
  footerNotice: string;
  statusOperational: string;
  pdfTitle: string;
  pdfFindings: string;
  pdfMasked: string;
  pdfRisk: string;
  pdfGenerated: string;
  pdfInternalUse: string;
  idleWarning: string;
  idleDismiss: string;
  errorLargeFile: string;
  errorInvalidFile: string;
  toastCopied: string;
  toastMasked: string;
  toastJson: string;
  toastPdf: string;
  toastAnalyzeFailed: string;
  toastCopyFailed: string;
  bugNote: string;
  bankName: string;
  bankDivision: string;
};

const translations: Record<Locale, Dictionary> = {
  tr: {
    heroTitle: "Kişisel Veri (PII) Tespit Aracı",
    heroSubtitle:
      "Metin veya dosyalardaki kişisel bilgileri anında tespit edin. Paylaşmadan önce uyumluluğu doğrulayın.",
    textareaLabel: "Analiz Edilecek İçerik",
    textareaPlaceholder:
      "Metninizi yapıştırın… (örn. E-posta: ahmet@banka.com, Telefon: 0555-123-4567, IBAN: TR..)",
    textareaHelper:
      "E-posta, telefon, TC kimlik, IBAN, kredi kartı, adres, doğum tarihi vb. kisisel ya da gizli veri tespit edilir.",
    analyzeCta: "Analiz Et",
    analyzeLoading: "Analiz ediliyor…",
    clear: "Temizle",
    fileUpload: "Dosya yükle",
    privacyToggle: "Gizlilik Modu (PII değerlerini maskele)",
    localProcessing: "Yerel İşleme",
    maskingActive: "Maskeleme Etkin",
    resultsHeading: "Sonuçlar",
    riskSummary: "Genel Risk",
    riskScore: "Risk Skoru",
    findingsCount: "Tespit Adedi",
    typesCount: "Tür Sayısı",
    recommendationLow: "Paylaşım için güvenli görünüyor.",
    recommendationMedium: "Hassas alanları maskeleyin veya çıkarın.",
    recommendationHigh:
      "Paylaşmadan önce PII’yi kaldırın. İnceleme gerekebilir.",
    findingsHeading: "Tespitler",
    findingsEmpty: "PII tespit edilmedi.",
    maskAction: "Maskele",
    copyValue: "Kopyala değer",
    flagForReview: "İşaretle (review)",
    confidence: "Güven Skoru",
    maskedOutputHeading: "Maskeleme Sonucu",
    maskedOutputHelper: "Maske uygulanmış metni kopyalayın veya dışa aktarın.",
    copyMasked: "Maske Metni Kopyala",
    exportPdf: "PDF’ye Aktar",
    exportJson: "JSON indir",
    copyClean: "Temiz Metni Kopyala",
    complianceText:
      "Veriler bu oturumda işlenir. Kalıcı olarak depolanmaz. Denetim amaçlı işlem kaydı tutulur.",
    sessionId: "Oturum ID",
    timestamp: "Zaman damgası",
    region: "Bölge",
    helpLabel: "Yardım",
    helpBody:
      "Analiz tamamen yerel olarak yapılır. Sonuçlar, paylaşmadan önce PII verilerini maskelemenize yardımcı olur.",
    language: "Dil",
    footerPrivacy: "Gizlilik",
    footerTerms: "Kullanım Koşulları",
    footerNotice: "KVKK / GDPR",
    statusOperational: "Operasyonel",
    pdfTitle: "PII Analiz Raporu",
    pdfFindings: "Tespit Özeti",
    pdfMasked: "Maskelenmiş Metin",
    pdfRisk: "Risk Derecesi",
    pdfGenerated: "Oluşturulma",
    pdfInternalUse: "Yalnızca İç Kullanım",
    idleWarning: "20 dakikalık hareketsizlik tespit edildi. Oturumunuz yakında sona erebilir.",
    idleDismiss: "Devam Et",
    errorLargeFile: "Dosya 2MB sınırını aşıyor. Lütfen daha küçük bir dosya seçin.",
    errorInvalidFile: "Yalnızca .txt, .csv veya .json dosyaları desteklenir.",
    toastCopied: "Panoya kopyalandı.",
    toastMasked: "Değer maskelendi.",
    toastJson: "JSON dışa aktarıldı.",
    toastPdf: "PDF oluşturuldu.",
    toastAnalyzeFailed: "Analiz gerçekleştirilemedi. Lütfen tekrar deneyin.",
    toastCopyFailed: "Kopyalama başarısız oldu.",
    bugNote: "Hata bildirimi için: ozgurguler@microsoft.com",
    bankName: "Dune Spice Melange Bank",
    bankDivision: "İç Sistemler",
  },
  en: {
    heroTitle: "Personal Data (PII) Detection Tool",
    heroSubtitle:
      "Identify personal information in text or files instantly. Validate compliance before sharing.",
    textareaLabel: "Content To Analyze",
    textareaPlaceholder:
      "Paste your text… (e.g. Email: ahmet@bank.com, Phone: 0555-123-4567, IBAN: TR..)",
    textareaHelper:
      "Detects email, phone, national ID, IBAN, credit card, address, birth date and other sensitive data.",
    analyzeCta: "Analyze",
    analyzeLoading: "Analyzing…",
    clear: "Clear",
    fileUpload: "Upload file",
    privacyToggle: "Privacy Mode (mask PII values)",
    localProcessing: "Local Processing",
    maskingActive: "Masking Enabled",
    resultsHeading: "Results",
    riskSummary: "Overall Risk",
    riskScore: "Risk Score",
    findingsCount: "Findings",
    typesCount: "Types",
    recommendationLow: "Looks safe to share.",
    recommendationMedium: "Mask or remove sensitive sections.",
    recommendationHigh: "Remove PII before sharing. Review may be required.",
    findingsHeading: "Findings",
    findingsEmpty: "No PII detected.",
    maskAction: "Mask",
    copyValue: "Copy value",
    flagForReview: "Flag for review",
    confidence: "Confidence",
    maskedOutputHeading: "Masked Output",
    maskedOutputHelper: "Copy or export the masked content.",
    copyMasked: "Copy Masked Text",
    exportPdf: "Export PDF",
    exportJson: "Download JSON",
    copyClean: "Copy Clean Text",
    complianceText:
      "Data is processed within this session. Nothing is stored permanently. An audit log is retained for compliance.",
    sessionId: "Session ID",
    timestamp: "Timestamp",
    region: "Region",
    helpLabel: "Help",
    helpBody:
      "Analysis runs locally. Use the results to mask PII before distributing content.",
    language: "Language",
    footerPrivacy: "Privacy",
    footerTerms: "Terms",
    footerNotice: "GDPR",
    statusOperational: "Operational",
    pdfTitle: "PII Analysis Report",
    pdfFindings: "Findings Summary",
    pdfMasked: "Masked Text",
    pdfRisk: "Risk Level",
    pdfGenerated: "Generated",
    pdfInternalUse: "Internal Use Only",
    idleWarning:
      "20 minutes of inactivity detected. Your session may expire soon.",
    idleDismiss: "Continue",
    errorLargeFile: "File exceeds the 2MB limit. Please choose a smaller file.",
    errorInvalidFile: "Only .txt, .csv, or .json files are supported.",
    toastCopied: "Copied to clipboard.",
    toastMasked: "Value masked.",
    toastJson: "JSON exported.",
    toastPdf: "PDF generated.",
    toastAnalyzeFailed: "Analysis failed. Please try again.",
    toastCopyFailed: "Copy failed.",
    bugNote: "Report issues: ozgurguler@microsoft.com",
    bankName: "Dune Spice Melange Bank",
    bankDivision: "Internal Systems",
  },
};

export const getDictionary = (locale: Locale) => translations[locale];

export const getOppositeLocale = (locale: Locale): Locale =>
  locale === "tr" ? "en" : "tr";
