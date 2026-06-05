/**
 * e-Faktur Coretax XML generator — Indonesia.
 *
 * Ported from CatatOrder's `lib/efaktur/generate-xml.ts` and adapted for the
 * unified Tokoflow Invoice type.
 *
 * Output follows the Coretax `TaxInvoice.xsd` schema v1.6. Element order is
 * strictly enforced by Coretax — do not reorder fields.
 *
 * Tax math: PMK 131/2024 — PPN 12% effective, with `OtherTaxBase = TaxBase × 11/12`
 * for TrxCode 04 (Nilai Lain). TrxCode 01 = full DPP. TrxCode 07/08 = exempt.
 *
 * Refs:
 *   - https://pajak.go.id (Coretax)
 *   - PMK 131/2024
 */

import type { TrxCode } from "./types";

export interface EfakturInvoiceItem {
  name: string;
  qty: number;
  price: number;
  unit?: string | null;
}

export interface EfakturInvoice {
  invoice_number: string;
  created_at: string;
  buyer_name?: string | null;
  buyer_address?: string | null;
  buyer_npwp?: string | null;
  trx_code?: TrxCode | null;
  discount?: number | null;
  items: EfakturInvoiceItem[];
}

export interface EfakturXmlOptions {
  invoices: EfakturInvoice[];
  sellerNpwp: string;
  sellerNitku?: string | null;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatNpwp16(npwp: string | undefined | null): string {
  if (!npwp) return "0000000000000000";
  const cleaned = npwp.replace(/[^0-9]/g, "");
  if (cleaned.length === 15) return "0" + cleaned;
  if (cleaned.length === 16) return cleaned;
  return cleaned.padStart(16, "0");
}

function formatIdtku(npwp: string | undefined | null, nitku?: string | null): string {
  if (nitku) {
    const cleaned = nitku.replace(/[^0-9]/g, "");
    if (cleaned.length === 22) return cleaned;
  }
  return formatNpwp16(npwp) + "000000";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toISOString().split("T")[0];
}

function formatDecimal(n: number): string {
  return n.toFixed(1);
}

function calculateTaxValues(price: number, qty: number, discount: number, trxCode: TrxCode) {
  const taxBase = price * qty - discount;

  let otherTaxBase: number;
  let vatRate: number;
  let vat: number;

  if (trxCode === "04") {
    otherTaxBase = Math.round((taxBase * 11) / 12 * 100) / 100;
    vatRate = 12;
    vat = Math.round(otherTaxBase * 0.12 * 100) / 100;
  } else if (trxCode === "01") {
    otherTaxBase = taxBase;
    vatRate = 12;
    vat = Math.round(taxBase * 0.12 * 100) / 100;
  } else if (trxCode === "07" || trxCode === "08") {
    otherTaxBase = 0;
    vatRate = 0;
    vat = 0;
  } else {
    otherTaxBase = Math.round((taxBase * 11) / 12 * 100) / 100;
    vatRate = 12;
    vat = Math.round(otherTaxBase * 0.12 * 100) / 100;
  }

  return { taxBase, otherTaxBase, vatRate, vat };
}

const UNIT_TO_DJP: Record<string, string> = {
  pcs: "UM.0018",
  buah: "UM.0018",
  unit: "UM.0018",
  pax: "UM.0018",
  porsi: "UM.0018",
  kg: "UM.0010",
  gram: "UM.0009",
  liter: "UM.0011",
  ml: "UM.0019",
  meter: "UM.0012",
  pack: "UM.0013",
  paket: "UM.0013",
  box: "UM.0014",
  carton: "UM.0015",
  set: "UM.0017",
  hour: "UM.0016",
  session: "UM.0016",
};

function resolveUnitCode(unit?: string | null): string {
  if (!unit) return "UM.0018";
  return UNIT_TO_DJP[unit.toLowerCase()] ?? "UM.0018";
}

/**
 * Generate Coretax-compliant XML for one or more invoices.
 * Caller wraps this in a `Blob` for download or stores as part of submission record.
 */
export function generateEfakturXml(options: EfakturXmlOptions): string {
  const { invoices, sellerNpwp, sellerNitku } = options;
  const tin = formatNpwp16(sellerNpwp);
  const sellerIdtku = formatIdtku(sellerNpwp, sellerNitku);

  let xml = `<?xml version='1.0' encoding='UTF-8'?>\n`;
  xml += `<TaxInvoiceBulk xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="TaxInvoice.xsd">\n`;
  xml += `  <TIN>${tin}</TIN>\n`;
  xml += `  <ListOfTaxInvoice>\n`;

  for (const invoice of invoices) {
    const trxCode: TrxCode = invoice.trx_code ?? "04";
    const buyerNpwp = formatNpwp16(invoice.buyer_npwp);
    const buyerIdtku = formatIdtku(invoice.buyer_npwp);
    const hasBuyerNpwp =
      invoice.buyer_npwp && invoice.buyer_npwp.replace(/[^0-9]/g, "").length >= 15;

    xml += `    <TaxInvoice>\n`;
    xml += `      <TaxInvoiceDate>${formatDate(invoice.created_at)}</TaxInvoiceDate>\n`;
    xml += `      <TaxInvoiceOpt>Normal</TaxInvoiceOpt>\n`;
    xml += `      <TrxCode>${trxCode}</TrxCode>\n`;
    xml += `      <AddInfo></AddInfo>\n`;
    xml += `      <CustomDoc></CustomDoc>\n`;
    xml += `      <CustomDocMonthYear></CustomDocMonthYear>\n`;
    xml += `      <RefDesc>${escapeXml(invoice.invoice_number)}</RefDesc>\n`;
    xml += `      <FacilityStamp></FacilityStamp>\n`;
    xml += `      <SellerIDTKU>${sellerIdtku}</SellerIDTKU>\n`;
    xml += `      <BuyerTin>${buyerNpwp}</BuyerTin>\n`;
    xml += `      <BuyerDocument>${hasBuyerNpwp ? "TIN" : "NIK"}</BuyerDocument>\n`;
    xml += `      <BuyerDocumentNumber>${hasBuyerNpwp ? "" : escapeXml(buyerNpwp)}</BuyerDocumentNumber>\n`;
    xml += `      <BuyerName>${escapeXml(invoice.buyer_name ?? "")}</BuyerName>\n`;
    xml += `      <BuyerAdress>${escapeXml(invoice.buyer_address ?? "")}</BuyerAdress>\n`;
    xml += `      <BuyerEmail></BuyerEmail>\n`;
    xml += `      <BuyerIDTKU>${buyerIdtku}</BuyerIDTKU>\n`;
    xml += `      <ListOfGoodService>\n`;

    const totalItemValue = invoice.items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const totalDiscount = invoice.discount ?? 0;

    for (const item of invoice.items) {
      const itemValue = item.price * item.qty;
      const itemDiscount =
        totalItemValue > 0 ? Math.round((itemValue / totalItemValue) * totalDiscount) : 0;
      const { taxBase, otherTaxBase, vatRate, vat } = calculateTaxValues(
        item.price,
        item.qty,
        itemDiscount,
        trxCode,
      );
      const unitCode = resolveUnitCode(item.unit);

      xml += `        <GoodService>\n`;
      xml += `          <Opt>A</Opt>\n`;
      xml += `          <Code>000000</Code>\n`;
      xml += `          <Name>${escapeXml(item.name)}</Name>\n`;
      xml += `          <Unit>${unitCode}</Unit>\n`;
      xml += `          <Price>${formatDecimal(item.price)}</Price>\n`;
      xml += `          <Qty>${formatDecimal(item.qty)}</Qty>\n`;
      xml += `          <TotalDiscount>${formatDecimal(itemDiscount)}</TotalDiscount>\n`;
      xml += `          <TaxBase>${formatDecimal(taxBase)}</TaxBase>\n`;
      xml += `          <OtherTaxBase>${formatDecimal(otherTaxBase)}</OtherTaxBase>\n`;
      xml += `          <VATRate>${formatDecimal(vatRate)}</VATRate>\n`;
      xml += `          <VAT>${formatDecimal(vat)}</VAT>\n`;
      xml += `          <STLGRate>0.0</STLGRate>\n`;
      xml += `          <STLG>0.0</STLG>\n`;
      xml += `        </GoodService>\n`;
    }

    xml += `      </ListOfGoodService>\n`;
    xml += `    </TaxInvoice>\n`;
  }

  xml += `  </ListOfTaxInvoice>\n`;
  xml += `</TaxInvoiceBulk>`;

  return xml;
}

/** SHA-256 hex of the raw XML — useful for storing alongside the submission record. */
export async function hashXml(xml: string): Promise<string> {
  const crypto = await import("node:crypto");
  return crypto.createHash("sha256").update(xml, "utf8").digest("hex");
}
