import PDFDocument from "pdfkit";
import { ProductProfitabilityResponseDto } from "../finance/dto/product-profitability-response.dto";
import { DailyReportResponseDto } from "./dto/daily-report-response.dto";
import { MonthlyReportResponseDto } from "./dto/monthly-report-response.dto";
import { StockAlertItemDto } from "./dto/stock-alert-item.dto";

/**
 * N'utilise PAS `toLocaleString("fr-FR")` : son séparateur de milliers est
 * U+202F (espace fine insécable), un caractère que la police Helvetica en
 * encodage WinAnsi (utilisée par défaut par pdfkit) ne sait pas afficher —
 * elle le rend comme "/" dans le PDF. Regroupement manuel par 3 chiffres
 * avec une espace ASCII ordinaire (U+0020), explicitement supportée.
 */
export function formatXaf(amount: number): string {
  const rounded = Math.round(amount);
  const isNegative = rounded < 0;
  const digits = Math.abs(rounded).toString();
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${isNegative ? "-" : ""}${grouped} FCFA`;
}

interface ReportPdfContent {
  title: string;
  periodLabel: string;
  organizationName: string;
  hasActivity: boolean;
  totalRevenue: number;
  totalExpenses: number;
  totalCogs: number;
  grossMargin: number;
  netProfit: number;
  salesCount: number;
  topProducts: ProductProfitabilityResponseDto[];
  stockAlerts: StockAlertItemDto[];
  footerNote: string;
}

/** Génère le PDF en mémoire (jamais écrit sur disque) et résout un Buffer
 * une fois le flux `pdfkit` terminé. */
function renderPdf(content: ReportPdfContent): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  doc.fontSize(18).font("Helvetica-Bold").text("UGE", { continued: true });
  doc.font("Helvetica").text(` — ${content.title}`);
  doc.fontSize(11).fillColor("#555555").text(content.organizationName);
  doc.text(content.periodLabel);
  doc.fillColor("#000000");
  doc.moveDown(1.5);

  if (!content.hasActivity) {
    doc
      .fontSize(12)
      .font("Helvetica-Oblique")
      .text("Aucune activité (vente) enregistrée sur cette période.");
    doc.font("Helvetica");
    doc.moveDown(1);
  }

  doc.fontSize(14).font("Helvetica-Bold").text("Indicateurs financiers");
  doc.font("Helvetica").fontSize(11);
  doc.moveDown(0.3);
  const summaryRows: [string, string][] = [
    ["Chiffre d'affaires", formatXaf(content.totalRevenue)],
    ["Nombre de ventes", String(content.salesCount)],
    ["Coût des marchandises vendues", formatXaf(content.totalCogs)],
    ["Marge brute", formatXaf(content.grossMargin)],
    ["Dépenses", formatXaf(content.totalExpenses)],
    ["Bénéfice net", formatXaf(content.netProfit)],
  ];
  for (const [label, value] of summaryRows) {
    doc.text(`${label} : ${value}`);
  }
  doc.moveDown(1);

  doc.fontSize(14).font("Helvetica-Bold").text("Produits les plus rentables");
  doc.font("Helvetica").fontSize(11);
  doc.moveDown(0.3);
  if (content.topProducts.length === 0) {
    doc.text("Aucune vente sur cette période.");
  } else {
    for (const product of content.topProducts) {
      doc.text(
        `${product.productName} — ${product.quantitySold} unité(s), ${formatXaf(product.totalRevenue)}, marge estimée ${formatXaf(product.estimatedMargin)}`,
      );
    }
  }
  doc.moveDown(1);

  doc.fontSize(14).font("Helvetica-Bold").text("Alertes stock");
  doc.font("Helvetica").fontSize(11);
  doc.moveDown(0.3);
  if (content.stockAlerts.length === 0) {
    doc.text("Aucune alerte, tous les produits sont au-dessus de leur seuil.");
  } else {
    for (const alert of content.stockAlerts) {
      const label = alert.status === "out" ? "Rupture" : "Stock bas";
      doc.text(`${alert.productName} : ${label} (${alert.stockQuantity} en stock)`);
    }
  }

  doc.moveDown(2);
  doc.fontSize(9).fillColor("#777777").text(content.footerNote, {
    align: "left",
  });

  doc.end();
  return done;
}

export function buildDailyReportPdf(
  report: DailyReportResponseDto,
): Promise<Buffer> {
  return renderPdf({
    title: "Rapport journalier",
    periodLabel: report.dateLabel,
    organizationName: report.organizationName,
    hasActivity: report.hasActivity,
    totalRevenue: report.totalRevenue,
    totalExpenses: report.totalExpenses,
    totalCogs: report.totalCogs,
    grossMargin: report.grossMargin,
    netProfit: report.netProfit,
    salesCount: report.salesCount,
    topProducts: report.topProducts,
    stockAlerts: report.stockAlerts,
    footerNote:
      "Récapitulatif de gestion généré automatiquement par UGE à partir des données enregistrées — ne constitue pas un document fiscal officiel.",
  });
}

export function buildMonthlyReportPdf(
  report: MonthlyReportResponseDto,
): Promise<Buffer> {
  return renderPdf({
    title: "Rapport mensuel",
    periodLabel: report.monthLabel,
    organizationName: report.organizationName,
    hasActivity: report.hasActivity,
    totalRevenue: report.totalRevenue,
    totalExpenses: report.totalExpenses,
    totalCogs: report.totalCogs,
    grossMargin: report.grossMargin,
    netProfit: report.netProfit,
    salesCount: report.salesCount,
    topProducts: report.topProducts,
    stockAlerts: report.stockAlerts,
    footerNote:
      "Récapitulatif de gestion généré automatiquement par UGE à partir des données enregistrées — ne constitue pas un document fiscal officiel ni une garantie de conformité comptable.",
  });
}
