/**
 * Phase 0 Spike 0.1: MyInvois sandbox hello-world
 *
 * Goal: Prove we can OAuth + submit an invoice to LHDN preprod, and receive a valid UUID.
 * Pass criteria: 200 response from /documentsubmissions with a `submissionUid` within 4h of coding.
 * Fail criteria: OAuth fails, or 3 consecutive submission errors we can't resolve.
 *
 * Prerequisites:
 *   1. Register at https://preprod.myinvois.hasil.gov.my (sandbox portal)
 *   2. In "ERP Portal" → register an ERP system → get CLIENT_ID + CLIENT_SECRET
 *   3. Get your sandbox TIN and BRN (Business Registration Number)
 *   4. cp scripts/phase-0/.env.phase-0.example scripts/phase-0/.env.phase-0
 *      then fill in the blanks
 *   5. Run: npx tsx --env-file=scripts/phase-0/.env.phase-0 scripts/phase-0/myinvois-spike.ts
 */

import crypto from "node:crypto";

const BASE =
  process.env.MYINVOIS_BASE_URL ?? "https://preprod-api.myinvois.hasil.gov.my";
const IDENTITY_BASE =
  process.env.MYINVOIS_IDENTITY_BASE ??
  "https://preprod-api.myinvois.hasil.gov.my";
const CLIENT_ID = process.env.MYINVOIS_CLIENT_ID;
const CLIENT_SECRET = process.env.MYINVOIS_CLIENT_SECRET;
const SUPPLIER_TIN = process.env.MYINVOIS_SUPPLIER_TIN;
const SUPPLIER_BRN = process.env.MYINVOIS_SUPPLIER_BRN;
const SUPPLIER_NAME = process.env.MYINVOIS_SUPPLIER_NAME ?? "Tokoflow Test Sdn Bhd";

const BUYER_TIN = process.env.MYINVOIS_BUYER_TIN ?? "EI00000000010";
const BUYER_NAME = process.env.MYINVOIS_BUYER_NAME ?? "End Consumer";

function requireEnv() {
  const missing: string[] = [];
  if (!CLIENT_ID) missing.push("MYINVOIS_CLIENT_ID");
  if (!CLIENT_SECRET) missing.push("MYINVOIS_CLIENT_SECRET");
  if (!SUPPLIER_TIN) missing.push("MYINVOIS_SUPPLIER_TIN");
  if (!SUPPLIER_BRN) missing.push("MYINVOIS_SUPPLIER_BRN");
  if (missing.length) {
    console.error("Missing env vars:", missing.join(", "));
    console.error(
      "Copy scripts/phase-0/.env.phase-0.example → scripts/phase-0/.env.phase-0 and fill in.",
    );
    process.exit(1);
  }
}

async function getAccessToken(): Promise<string> {
  const res = await fetch(`${IDENTITY_BASE}/connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID!,
      client_secret: CLIENT_SECRET!,
      grant_type: "client_credentials",
      scope: "InvoicingAPI",
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`OAuth ${res.status}: ${text}`);
  }
  const json = JSON.parse(text);
  if (!json.access_token) {
    throw new Error(`OAuth returned no access_token: ${text}`);
  }
  return json.access_token as string;
}

function buildInvoice() {
  const invoiceId = `INV-SPIKE-${Date.now()}`;
  const now = new Date();
  const issueDate = now.toISOString().slice(0, 10);
  const issueTime = now.toISOString().slice(11, 19) + "Z";

  // Minimal valid UBL 2.1 Invoice in MyInvois JSON format.
  // If this fails validation, LHDN response will list rejection reasons — tune from there.
  const invoice = {
    _D: "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
    _A: "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
    _B: "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
    Invoice: [
      {
        ID: [{ _: invoiceId }],
        IssueDate: [{ _: issueDate }],
        IssueTime: [{ _: issueTime }],
        InvoiceTypeCode: [{ _: "01", listVersionID: "1.1" }],
        DocumentCurrencyCode: [{ _: "MYR" }],
        AccountingSupplierParty: [
          {
            Party: [
              {
                IndustryClassificationCode: [
                  { _: "47910", name: "Retail sale via mail order or Internet" },
                ],
                PartyIdentification: [
                  { ID: [{ _: SUPPLIER_TIN!, schemeID: "TIN" }] },
                  { ID: [{ _: SUPPLIER_BRN!, schemeID: "BRN" }] },
                ],
                PostalAddress: [
                  {
                    CityName: [{ _: "Kuala Lumpur" }],
                    PostalZone: [{ _: "50480" }],
                    CountrySubentityCode: [{ _: "14" }],
                    AddressLine: [{ Line: [{ _: "Jalan Test 1" }] }],
                    Country: [
                      {
                        IdentificationCode: [
                          { _: "MYS", listID: "ISO3166-1", listAgencyID: "6" },
                        ],
                      },
                    ],
                  },
                ],
                PartyLegalEntity: [
                  { RegistrationName: [{ _: SUPPLIER_NAME }] },
                ],
                Contact: [
                  {
                    Telephone: [{ _: "+60123456789" }],
                    ElectronicMail: [{ _: "test@tokoflow.com" }],
                  },
                ],
              },
            ],
          },
        ],
        AccountingCustomerParty: [
          {
            Party: [
              {
                PartyIdentification: [
                  { ID: [{ _: BUYER_TIN, schemeID: "TIN" }] },
                  { ID: [{ _: "NA", schemeID: "BRN" }] },
                ],
                PostalAddress: [
                  {
                    CityName: [{ _: "Kuala Lumpur" }],
                    PostalZone: [{ _: "50000" }],
                    CountrySubentityCode: [{ _: "14" }],
                    AddressLine: [{ Line: [{ _: "NA" }] }],
                    Country: [
                      {
                        IdentificationCode: [
                          { _: "MYS", listID: "ISO3166-1", listAgencyID: "6" },
                        ],
                      },
                    ],
                  },
                ],
                PartyLegalEntity: [{ RegistrationName: [{ _: BUYER_NAME }] }],
                Contact: [
                  {
                    Telephone: [{ _: "NA" }],
                    ElectronicMail: [{ _: "NA" }],
                  },
                ],
              },
            ],
          },
        ],
        InvoiceLine: [
          {
            ID: [{ _: "1" }],
            InvoicedQuantity: [{ _: 1, unitCode: "XUN" }],
            LineExtensionAmount: [{ _: 10.0, currencyID: "MYR" }],
            TaxTotal: [
              {
                TaxAmount: [{ _: 0.6, currencyID: "MYR" }],
                TaxSubtotal: [
                  {
                    TaxableAmount: [{ _: 10.0, currencyID: "MYR" }],
                    TaxAmount: [{ _: 0.6, currencyID: "MYR" }],
                    Percent: [{ _: 6 }],
                    TaxCategory: [
                      {
                        ID: [{ _: "01" }],
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
            Item: [
              {
                Name: [{ _: "Spike test product" }],
                CommodityClassification: [
                  { ItemClassificationCode: [{ _: "001", listID: "CLASS" }] },
                ],
              },
            ],
            Price: [{ PriceAmount: [{ _: 10.0, currencyID: "MYR" }] }],
            ItemPriceExtension: [
              { Amount: [{ _: 10.0, currencyID: "MYR" }] },
            ],
          },
        ],
        TaxTotal: [
          {
            TaxAmount: [{ _: 0.6, currencyID: "MYR" }],
            TaxSubtotal: [
              {
                TaxableAmount: [{ _: 10.0, currencyID: "MYR" }],
                TaxAmount: [{ _: 0.6, currencyID: "MYR" }],
                TaxCategory: [
                  {
                    ID: [{ _: "01" }],
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
            LineExtensionAmount: [{ _: 10.0, currencyID: "MYR" }],
            TaxExclusiveAmount: [{ _: 10.0, currencyID: "MYR" }],
            TaxInclusiveAmount: [{ _: 10.6, currencyID: "MYR" }],
            PayableAmount: [{ _: 10.6, currencyID: "MYR" }],
          },
        ],
      },
    ],
  };

  return { invoice, invoiceId };
}

async function submitDocument(
  token: string,
  invoice: unknown,
  invoiceId: string,
) {
  const docJson = JSON.stringify(invoice);
  const base64 = Buffer.from(docJson, "utf8").toString("base64");
  const hash = crypto.createHash("sha256").update(docJson, "utf8").digest("hex");

  const body = {
    documents: [
      {
        format: "JSON",
        documentHash: hash,
        codeNumber: invoiceId,
        document: base64,
      },
    ],
  };

  const res = await fetch(`${BASE}/api/v1.0/documentsubmissions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  return { status: res.status, body: text };
}

async function main() {
  console.log("─".repeat(60));
  console.log("Phase 0.1: MyInvois sandbox spike");
  console.log("─".repeat(60));
  requireEnv();

  console.log("\n[1/2] OAuth client_credentials...");
  const token = await getAccessToken();
  console.log(`  ✓ token: ${token.slice(0, 24)}…`);

  console.log("\n[2/2] Submit minimal invoice...");
  const { invoice, invoiceId } = buildInvoice();
  const { status, body } = await submitDocument(token, invoice, invoiceId);
  console.log(`  HTTP ${status}`);
  console.log(`  Body: ${body.slice(0, 1000)}${body.length > 1000 ? "…" : ""}`);

  let parsed: any = null;
  try {
    parsed = JSON.parse(body);
  } catch {
    /* ignore */
  }

  const submissionUid = parsed?.submissionUid;
  const accepted = parsed?.acceptedDocuments?.[0]?.uuid;
  const rejected = parsed?.rejectedDocuments;

  console.log("\n" + "─".repeat(60));
  if (status === 200 && submissionUid && accepted) {
    console.log(`✅ PASS — submissionUid=${submissionUid}`);
    console.log(`         accepted uuid=${accepted}`);
    console.log(`         invoiceId=${invoiceId}`);
    console.log("\n→ Phase 0.1 validated. Proceed to Stage 2.");
  } else if (status === 200 && submissionUid) {
    console.log(`⚠️  PARTIAL — submissionUid=${submissionUid}`);
    console.log(`   but document was rejected. Tune payload from:`);
    console.log(`   ${JSON.stringify(rejected, null, 2)}`);
    console.log("\n→ Iteration needed. Spike is alive, just fix validation errors.");
  } else {
    console.log(`❌ FAIL — HTTP ${status}`);
    console.log("\n→ Stop. Review response and LHDN docs before continuing.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("\n❌ FAIL — exception");
  console.error(err);
  console.error("\n→ Spike failed. Do NOT proceed to Phase 1 e-Invoice work yet.");
  process.exit(1);
});
