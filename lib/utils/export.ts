import type * as XLSXType from "xlsx";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateExcel<T extends Record<string, any>>(
  data: T[],
  sheetName: string = "Sheet1",
  headers?: { key: keyof T; label: string }[]
): Promise<XLSXType.WorkBook> {
  const XLSX = await import("xlsx");
  let worksheetData: Record<string, unknown>[];
  if (headers) {
    worksheetData = data.map((row) => {
      const newRow: Record<string, unknown> = {};
      headers.forEach(({ key, label }) => {
        newRow[label] = row[key];
      });
      return newRow;
    });
  } else {
    worksheetData = data as Record<string, unknown>[];
  }
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return workbook;
}

export async function workbookToArrayBuffer(workbook: XLSXType.WorkBook): Promise<ArrayBuffer> {
  const XLSX = await import("xlsx");
  return XLSX.write(workbook, { bookType: "xlsx", type: "array" });
}

export function downloadBlob(
  content: string | ArrayBuffer,
  filename: string,
  format: "csv" | "xlsx"
): void {
  const mimeType =
    format === "csv"
      ? "text/csv;charset=utf-8;"
      : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
