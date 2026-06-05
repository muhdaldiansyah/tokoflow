import type { Invoice } from "@/features/invoices/types/invoice.types";
import { PAYMENT_TERMS_LABELS, INVOICE_STATUS_LABELS } from "@/features/invoices/types/invoice.types";

export function generateInvoicePDF(invoice: Invoice) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { jsPDF } = require("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const pageW = 210;
  const pageH = 297;
  const margin = 18;
  const contentW = pageW - margin * 2;
  let y = margin;

  const rm = (n: number) => `RM ${n.toLocaleString("en-MY")}`;
  const rightText = (text: string, yPos: number) => {
    doc.text(text, pageW - margin - doc.getTextWidth(text), yPos);
  };

  // ── HEADER ──
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", margin, y + 5);

  const isPaid = invoice.payment_status === "paid";
  const isOverdue = invoice.status === "overdue";
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  if (isPaid) doc.setTextColor(21, 128, 61);
  else if (isOverdue) doc.setTextColor(220, 38, 38);
  else if (invoice.payment_status === "partial") doc.setTextColor(161, 98, 7);
  else doc.setTextColor(120);
  const statusLabel = INVOICE_STATUS_LABELS[invoice.status] || invoice.status;
  const badgeText = isPaid
    ? "PAID"
    : invoice.payment_status === "partial"
      ? "PARTIAL"
      : statusLabel.toUpperCase();
  doc.text(badgeText, margin + 40, y + 5);

  // Invoice details (right)
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  rightText(invoice.invoice_number, y + 1);
  rightText(
    `Date: ${new Date(invoice.created_at).toLocaleDateString("en-MY", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}`,
    y + 5,
  );
  let rightY = y + 9;
  if (invoice.due_date) {
    rightText(
      `Due: ${new Date(invoice.due_date).toLocaleDateString("en-MY", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}`,
      rightY,
    );
    rightY += 4;
  }
  if (invoice.payment_terms) {
    rightText(`Terms: ${PAYMENT_TERMS_LABELS[invoice.payment_terms]}`, rightY);
    rightY += 4;
  }
  doc.setTextColor(0);

  y = Math.max(y + 10, rightY) + 2;

  // Thin separator
  doc.setDrawColor(230);
  doc.setLineWidth(0.2);
  doc.line(margin, y, margin + contentW, y);
  y += 5;

  // ── SELLER & BUYER ──
  const colW = contentW / 2;
  const buyerX = margin + colW + 3;

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(150);
  doc.text("FROM", margin, y);
  doc.text("TO", buyerX, y);
  doc.setTextColor(0);
  y += 4;

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.seller_name || "-", margin, y);
  doc.text(invoice.buyer_name || "-", buyerX, y);
  y += 4.5;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);

  const sellerTin = invoice.seller_tin || invoice.seller_npwp || null;
  const buyerTin = invoice.buyer_tin || invoice.buyer_npwp || null;

  const sellerLines = [
    invoice.seller_address || "-",
    invoice.seller_phone || "-",
    `TIN: ${sellerTin || "-"}`,
  ];
  if (invoice.seller_brn) sellerLines.push(`BRN: ${invoice.seller_brn}`);
  if (invoice.seller_sst_registration_id) {
    sellerLines.push(`SST: ${invoice.seller_sst_registration_id}`);
  }

  const buyerLines = [
    invoice.buyer_address || "-",
    invoice.buyer_phone || "-",
    `TIN: ${buyerTin || "-"}`,
  ];
  if (invoice.buyer_brn) buyerLines.push(`BRN: ${invoice.buyer_brn}`);
  if (invoice.buyer_sst_id) buyerLines.push(`SST: ${invoice.buyer_sst_id}`);

  const maxLines = Math.max(sellerLines.length, buyerLines.length);
  for (let i = 0; i < maxLines; i++) {
    if (sellerLines[i]) doc.text(sellerLines[i], margin, y);
    if (buyerLines[i]) doc.text(buyerLines[i], buyerX, y);
    y += 4;
  }
  doc.setTextColor(0);

  // MyInvois reference line
  if (invoice.myinvois_uuid) {
    y += 2;
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(120);
    doc.text(`LHDN MyInvois: ${invoice.myinvois_uuid}`, margin, y);
    if (invoice.myinvois_long_id) {
      y += 3.5;
      doc.text(`Long ID: ${invoice.myinvois_long_id}`, margin, y);
    }
    doc.setTextColor(0);
  }

  y += 4;

  // ── ITEMS TABLE ──
  const colNo = margin + 2;
  const colName = margin + 12;
  const colQty = margin + contentW - 68;
  const colPrice = margin + contentW - 50;

  doc.setFillColor(247, 247, 247);
  doc.rect(margin, y - 3.5, contentW, 7, "F");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100);
  doc.text("No", colNo, y);
  doc.text("Item", colName, y);
  doc.text("Qty", colQty, y);
  doc.text("Price", colPrice, y);
  rightText("Amount", y);
  doc.setTextColor(0);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  invoice.items.forEach((item, index) => {
    const amount = item.price * item.qty;
    doc.text(`${index + 1}`, colNo, y);

    const maxNameW = colQty - colName - 4;
    let name = item.name;
    while (doc.getTextWidth(name) > maxNameW && name.length > 3) name = name.slice(0, -1);
    if (name !== item.name) name += "...";
    doc.text(name, colName, y);

    doc.text(`${item.qty}`, colQty, y);
    doc.text(rm(item.price), colPrice, y);
    rightText(rm(amount), y);

    y += 2.5;
    doc.setDrawColor(240);
    doc.setLineWidth(0.1);
    doc.line(margin, y, margin + contentW, y);
    y += 4;
  });

  // ── TOTALS ──
  y += 3;
  const totalsX = margin + contentW - 60;
  doc.setFontSize(8.5);

  const addRow = (label: string, value: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.text(label, totalsX, y);
    rightText(value, y);
    y += 4.5;
  };

  const taxable = Math.max(0, invoice.subtotal - invoice.discount);
  const sstRate = invoice.sst_rate ?? invoice.ppn_rate ?? 0;
  const sstAmount = invoice.sst_amount ?? invoice.ppn_amount ?? 0;

  addRow("Subtotal", rm(invoice.subtotal));
  if (invoice.discount > 0) addRow("Discount", `-${rm(invoice.discount)}`);
  addRow("Taxable", rm(taxable));
  addRow(`SST ${sstRate}%`, rm(sstAmount));

  // Total line
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.line(totalsX, y - 1, margin + contentW, y - 1);
  y += 3;
  doc.setFontSize(11);
  addRow("Total", rm(invoice.total), true);

  // Payment
  doc.setFontSize(8.5);
  if (invoice.paid_amount > 0) {
    addRow("Paid", rm(invoice.paid_amount));
    const remaining = invoice.total - invoice.paid_amount;
    if (remaining > 0) {
      doc.setTextColor(200, 0, 0);
      addRow("Balance", rm(remaining), true);
      doc.setTextColor(0);
    }
  }

  // ── NOTES ──
  if (invoice.notes) {
    y += 4;
    doc.setDrawColor(235);
    doc.setLineWidth(0.2);
    doc.line(margin, y, margin + contentW, y);
    y += 4;
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(150);
    doc.text("NOTES", margin, y);
    doc.setTextColor(0);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    const noteLines = doc.splitTextToSize(invoice.notes, contentW);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 4;
  }

  // ── FOOTER ──
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(170);
  doc.text(
    "Generated with Tokoflow — tokoflow.com",
    margin,
    Math.min(Math.max(y + 12, pageH - 12), pageH - 8),
  );

  return doc;
}
