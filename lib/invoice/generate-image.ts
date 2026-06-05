/**
 * Convert a data URL string to a Blob.
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, base64] = dataUrl.split(",");
  const mime = meta.match(/:(.*?);/)?.[1] || "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

/**
 * Capture a DOM element as a PNG Blob.
 * Uses 2x pixel ratio by default for crisp mobile display.
 */
export async function captureInvoiceImage(
  element: HTMLElement,
  pixelRatio = 2
): Promise<Blob> {
  const { toPng } = await import("html-to-image");
  const dataUrl = await toPng(element, {
    pixelRatio,
    backgroundColor: "#ffffff",
  });
  return dataUrlToBlob(dataUrl);
}
