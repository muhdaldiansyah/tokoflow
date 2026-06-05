/**
 * e-Faktur Coretax type primitives — Indonesia.
 *
 * Coretax (DJP) reference: https://pajak.go.id/coretax
 *
 * TrxCode (Transaction Code) governs PPN treatment:
 *   01 — Penyerahan kepada selain Pemungut PPN (full DPP × 12%)
 *   02 — Penyerahan kepada Pemungut Bendaharawan
 *   03 — Penyerahan kepada Pemungut PPN Lainnya (BUMN/Badan Tertentu)
 *   04 — DPP Nilai Lain (DPP × 11/12 × 12% = effective 11%)
 *   05 — Besaran Tertentu
 *   06 — Penyerahan Lainnya (termasuk PPN-DTP)
 *   07 — Penyerahan yang PPN-nya tidak dipungut
 *   08 — Penyerahan yang dibebaskan dari pengenaan PPN
 *   09 — Penyerahan aktiva (Pasal 16D)
 */

export type TrxCode = "01" | "02" | "03" | "04" | "05" | "06" | "07" | "08" | "09";

export const TRX_CODE_LABELS: Record<TrxCode, string> = {
  "01": "Penyerahan kepada selain Pemungut PPN",
  "02": "Penyerahan kepada Pemungut Bendaharawan",
  "03": "Penyerahan kepada Pemungut PPN Lainnya",
  "04": "DPP Nilai Lain",
  "05": "Besaran Tertentu",
  "06": "Penyerahan Lainnya (PPN-DTP)",
  "07": "PPN tidak dipungut",
  "08": "Dibebaskan dari PPN",
  "09": "Penyerahan aktiva (Pasal 16D)",
};

export const DEFAULT_TRX_CODE: TrxCode = "04";
