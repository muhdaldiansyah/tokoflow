import crypto from "node:crypto";
import type { MyInvoisInvoice } from "./types";

// UBL 2.1 Invoice document in MyInvois JSON format.
// LHDN accepts either XML or JSON; we use JSON for simpler downstream handling.
// Schema reference: https://sdk.myinvois.hasil.gov.my/einvoicingapi/06-signature/

const UBL_INVOICE = "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2";
const UBL_CAC = "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2";
const UBL_CBC = "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2";

function moneyAmount(value: number, currency = "MYR") {
  return [{ _: Number(value.toFixed(2)), currencyID: currency }];
}

function simpleText(value: string | number) {
  return [{ _: value }];
}

function buildParty(party: MyInvoisInvoice["supplier"] | MyInvoisInvoice["buyer"]) {
  const partyIdentifications = [
    { ID: [{ _: party.tin, schemeID: "TIN" }] },
    { ID: [{ _: party.brn ?? "NA", schemeID: "BRN" }] },
  ];
  if (party.sstRegistrationId) {
    partyIdentifications.push({ ID: [{ _: party.sstRegistrationId, schemeID: "SST" }] });
  }

  return {
    Party: [
      {
        ...(party.industryClassification && {
          IndustryClassificationCode: [
            { _: party.industryClassification.code, name: party.industryClassification.name },
          ],
        }),
        PartyIdentification: partyIdentifications,
        PostalAddress: [
          {
            CityName: simpleText(party.address.city),
            PostalZone: simpleText(party.address.postalZone),
            CountrySubentityCode: simpleText(party.address.stateCode),
            AddressLine: [
              { Line: simpleText(party.address.line1) },
              ...(party.address.line2 ? [{ Line: simpleText(party.address.line2) }] : []),
              ...(party.address.line3 ? [{ Line: simpleText(party.address.line3) }] : []),
            ],
            Country: [
              {
                IdentificationCode: [
                  { _: party.address.countryCode, listID: "ISO3166-1", listAgencyID: "6" },
                ],
              },
            ],
          },
        ],
        PartyLegalEntity: [{ RegistrationName: simpleText(party.name) }],
        Contact: [
          {
            Telephone: simpleText(party.phone ?? "NA"),
            ElectronicMail: simpleText(party.email ?? "NA"),
          },
        ],
      },
    ],
  };
}

function buildInvoiceLine(line: MyInvoisInvoice["lines"][number], currency: string) {
  const lineExtension = line.lineAmount - (line.discountAmount ?? 0);

  return {
    ID: simpleText(line.id),
    InvoicedQuantity: [{ _: line.quantity, unitCode: line.unitCode }],
    LineExtensionAmount: moneyAmount(lineExtension, currency),
    TaxTotal: [
      {
        TaxAmount: moneyAmount(line.tax.amount, currency),
        TaxSubtotal: [
          {
            TaxableAmount: moneyAmount(lineExtension, currency),
            TaxAmount: moneyAmount(line.tax.amount, currency),
            Percent: simpleText(line.tax.rate),
            TaxCategory: [
              {
                ID: simpleText(line.tax.category),
                TaxScheme: [
                  {
                    ID: [{ _: "OTH", schemeID: "UN/ECE 5153", schemeAgencyID: "6" }],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    Item: [
      {
        Name: simpleText(line.description),
        ...(line.classification && {
          CommodityClassification: [
            { ItemClassificationCode: [{ _: line.classification.code, listID: "CLASS" }] },
          ],
        }),
      },
    ],
    Price: [{ PriceAmount: moneyAmount(line.unitPrice, currency) }],
    ItemPriceExtension: [{ Amount: moneyAmount(lineExtension, currency) }],
  };
}

export interface GeneratedInvoice {
  /** Full UBL 2.1 JSON structure ready for LHDN submission. */
  document: Record<string, unknown>;
  /** Base64-encoded JSON string (required by MyInvois submit API). */
  base64: string;
  /** SHA-256 hex digest of the raw JSON (required by MyInvois submit API). */
  hash: string;
  /** Merchant-side invoice code (supplier's reference). */
  codeNumber: string;
}

export function generateMyInvoisDocument(invoice: MyInvoisInvoice): GeneratedInvoice {
  const doc: Record<string, unknown> = {
    _D: UBL_INVOICE,
    _A: UBL_CAC,
    _B: UBL_CBC,
    Invoice: [
      {
        ID: simpleText(invoice.invoiceNumber),
        IssueDate: simpleText(invoice.issueDate),
        IssueTime: simpleText(invoice.issueTime),
        InvoiceTypeCode: [{ _: invoice.documentType, listVersionID: "1.1" }],
        DocumentCurrencyCode: simpleText(invoice.currencyCode),
        ...(invoice.note && { Note: simpleText(invoice.note) }),
        AccountingSupplierParty: [buildParty(invoice.supplier)],
        AccountingCustomerParty: [buildParty(invoice.buyer)],
        ...(invoice.paymentMeansCode && {
          PaymentMeans: [
            { PaymentMeansCode: simpleText(invoice.paymentMeansCode) },
          ],
        }),
        ...(invoice.paymentTerms && {
          PaymentTerms: [{ Note: simpleText(invoice.paymentTerms) }],
        }),
        InvoiceLine: invoice.lines.map((line) =>
          buildInvoiceLine(line, invoice.currencyCode),
        ),
        TaxTotal: [
          {
            TaxAmount: moneyAmount(invoice.totals.taxAmount, invoice.currencyCode),
            TaxSubtotal: [
              {
                TaxableAmount: moneyAmount(invoice.totals.taxExclusive, invoice.currencyCode),
                TaxAmount: moneyAmount(invoice.totals.taxAmount, invoice.currencyCode),
                TaxCategory: [
                  {
                    ID: simpleText("01"),
                    TaxScheme: [
                      {
                        ID: [
                          { _: "OTH", schemeID: "UN/ECE 5153", schemeAgencyID: "6" },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        LegalMonetaryTotal: [
          {
            LineExtensionAmount: moneyAmount(invoice.totals.lineExtension, invoice.currencyCode),
            TaxExclusiveAmount: moneyAmount(invoice.totals.taxExclusive, invoice.currencyCode),
            TaxInclusiveAmount: moneyAmount(invoice.totals.taxInclusive, invoice.currencyCode),
            PayableAmount: moneyAmount(invoice.totals.payable, invoice.currencyCode),
          },
        ],
      },
    ],
  };

  const json = JSON.stringify(doc);
  const base64 = Buffer.from(json, "utf8").toString("base64");
  const hash = crypto.createHash("sha256").update(json, "utf8").digest("hex");

  return {
    document: doc,
    base64,
    hash,
    codeNumber: invoice.invoiceNumber,
  };
}

/**
 * Compute SST totals from line items. Handles mixed 0% / 6% lines and discount allocation.
 */
export function computeInvoiceTotals(
  lines: MyInvoisInvoice["lines"],
): MyInvoisInvoice["totals"] {
  let lineExtension = 0;
  let taxAmount = 0;
  let discount = 0;

  for (const line of lines) {
    const discounted = line.lineAmount - (line.discountAmount ?? 0);
    lineExtension += discounted;
    taxAmount += line.tax.amount;
    discount += line.discountAmount ?? 0;
  }

  const taxExclusive = lineExtension;
  const taxInclusive = taxExclusive + taxAmount;
  const payable = taxInclusive;

  return {
    lineExtension: Number((lineExtension + discount).toFixed(2)),
    taxExclusive: Number(taxExclusive.toFixed(2)),
    taxInclusive: Number(taxInclusive.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    payable: Number(payable.toFixed(2)),
  };
}

/**
 * Default B2C buyer for walk-in / anonymous orders — LHDN standard generic TIN.
 */
export const MY_INVOIS_WALK_IN_BUYER: MyInvoisInvoice["buyer"] = {
  tin: "EI00000000010",
  brn: "NA",
  name: "End Consumer",
  address: {
    line1: "NA",
    city: "NA",
    postalZone: "00000",
    stateCode: "17", // "Wilayah Persekutuan" fallback
    countryCode: "MYS",
  },
};

/**
 * Malaysian state codes (LHDN CountrySubentityCode).
 * Reference: https://sdk.myinvois.hasil.gov.my/codes/state-codes/
 */
export const MY_STATE_CODES: Record<string, string> = {
  Johor: "01",
  Kedah: "02",
  Kelantan: "03",
  Melaka: "04",
  "Negeri Sembilan": "05",
  Pahang: "06",
  Penang: "07",
  "Pulau Pinang": "07",
  Perak: "08",
  Perlis: "09",
  Selangor: "10",
  Terengganu: "11",
  Sabah: "12",
  Sarawak: "13",
  "Kuala Lumpur": "14",
  Labuan: "15",
  Putrajaya: "16",
  NA: "17",
};
