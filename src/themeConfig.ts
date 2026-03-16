/**
 * Theme Configuration File
 * Use this file to modify every text color and drop shadow color in the application.
 * You can use hex codes (e.g., "#FFFFFF"), rgba (e.g., "rgba(0,0,0,0.5)"), or CSS variables.
 */

export const themeConfig = {
  // --- Global / Layout ---
  mainTextColor: "#1e293b",
  mutedTextColor: "#64748b",
  syncContributionsTextColor: "#0f172a",
  footerTextColor: "#000000",

  // --- Header ---
  headerTitleColor: "#000000",
  headerTitleShadow: "4px 4px 0px rgba(0,0,0,1)",
  headerIconColor: "#ffffff",
  headerIconBg: "#D1C4E9", // p5-purple

  // --- Section Headers ---
  // (People, Cost Items, Balances, Transactions)
  sectionHeaderTextColor: "#000000",
  sectionHeaderShadowColor: "#B2EBF2", // Pastel Cyan shadow
  sectionIconColor: "#D1C4E9", // p5-purple

  // --- Form Elements ---
  formLabelColor: "#000000",
  formInputTextColor: "#0f172a",
  buttonTextColor: "#ffffff",
  buttonTextShadow: "2px 2px 0px rgba(0,0,0,0.5)",

  // --- People List ---
  personNameColor: "#000000",
  personPaidColor: "#000000",
  personPaidLabelColor: "rgba(0,0,0,0.4)",
  personRemoveIconColor: "rgba(0,0,0,0.6)",

  // --- Cost Items List (Dark Section) ---
  costItemsCardBg: "#1e293b",
  costItemNameColor: "#ffffff",
  costItemAmountColor: "#FFD54F", // p5-yellow
  costItemPaidByColor: "rgba(255,255,255,0.6)",
  costItemLabelColor: "rgba(255,255,255,0.7)",
  costItemRemoveIconColor: "rgba(255,255,255,0.4)",

  // --- Balances Table ---
  tableHeaderBg: "#000000",
  tableHeaderTextColor: "#ffffff",
  tableNameColor: "#000000",
  tablePaidColor: "#000000",
  tableNetPositiveColor: "#059669", // emerald-600
  tableNetNegativeColor: "#e11d48", // rose-600
  tableNetNeutralColor: "#94a3b8",  // slate-400
  tableNetShadow: "1px 1px 0px rgba(255,255,255,0.5)",

  // --- Suggested Transactions (Dark Section) ---
  transactionsCardBg: "#0f172a",
  transactionsHeaderColor: "#B2EBF2", // p5-cyan
  transactionsHeaderShadow: "2px 2px 0px rgba(0,0,0,0.5)",
  transactionDebtorLabel: "#B2EBF2", // p5-cyan
  transactionCreditorLabel: "#ffffff",
  transactionPaysLabel: "rgba(255,255,255,0.8)",
  transactionToLabel: "rgba(255,255,255,0.9)",
  transactionAmountColor: "#FFD54F", // p5-yellow
  transactionAmountShadow: "2px 2px 0px rgba(0,0,0,0.8)",
  transactionNameColor: "#B2EBF2", // p5-cyan
  transactionNameShadow: "1px 1px 0px rgba(0,0,0,0.5)",
  noPeopleTextColor: "#000000",
  addPeopleToSeeTextColor: "rgba(255,255,255,0.6)",
  discrepancyWarningTextColor: "#ffffff",
  allSettledTextColor: "#C8E6C9",

  // --- Summary Cards ---
  totalCostCardBg: "#D1C4E9", // p5-purple
  totalCostLabelColor: "#ffffff",
  totalCostValueColor: "#ffffff",
  costPerPersonCardBg: "#B2EBF2", // p5-cyan
  costPerPersonLabelColor: "#000000",
  costPerPersonValueColor: "#000000",
  summaryCardShadow: "8px 8px 0px 0px rgba(0,0,0,1)",

  // --- Share Summary (Image Export) ---
  shareBg: "#0f172a",
  shareTitleColor: "#ffffff",
  shareDateColor: "rgba(255,255,255,0.4)",
  shareStatLabelColor: "#475569", // slate-600
  shareStatValueColor: "#1e293b", // slate-800
  shareSectionHeaderColor: "rgba(255,255,255,0.4)",
  shareItemNameColor: "#ffffff",
  sharePaysLabelColor: "rgba(255,255,255,0.4)",
  shareAmountLabelColor: "rgba(255,255,255,0.4)",
  shareAmountValueColor: "#FFD54F", // p5-yellow
  shareFooterColor: "rgba(255,255,255,0.4)",
  shareShadowColor: "rgba(255,255,255,0.1)",
  shareIconBg: "#D1C4E9",
  shareIconColor: "#1e293b",
};
