// OpenRouter image generation client for product photos.
//
// Model: Gemini 2.5 Flash Image ("Nano Banana") — google/gemini-2.5-flash-image
//   - $0.03/image (sweet spot of cheap + good)
//   - Strong Asian/MY cultural defaults — handles nasi lemak, kuih lapis,
//     hijab fashion, etc. without explicit re-prompting
//   - Single model handles BOTH text-to-image (generate) AND
//     image-to-image (enhance)
//   - Returns base64 data URL inside choices[0].message.images[0]
//
// We deliberately do NOT use FLUX.2 Pro here even though it's the marketing-
// hero sweet-spot, because product images run at higher volume per merchant
// (5–20 products) and cultural fidelity matters more than editorial polish.
// Marketing hero ran on GPT-5.4 Image 2 (one-shot, $0.20); product images
// run on Gemini Flash (high-volume, $0.03).

import { buildGeneratePrompt, buildEnhancePrompt, type ProductPromptInput } from "./product-image-prompts";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL_ID = "google/gemini-2.5-flash-image";

export type ProductImageMode = "generate" | "enhance";

export interface GenerateProductImageParams extends ProductPromptInput {
  mode: ProductImageMode;
  /** Required when mode === "enhance" — the existing image to improve. */
  existingImageUrl?: string;
}

interface OpenRouterImageResponse {
  choices?: Array<{
    message?: {
      content?: string;
      images?: Array<{
        image_url?: { url?: string };
      }>;
    };
  }>;
  error?: { message?: string };
}

/**
 * Generates a product image and returns the raw bytes + mime type.
 * Caller is responsible for storage upload + DB update.
 */
export async function generateProductImage(
  params: GenerateProductImageParams,
): Promise<{ buffer: Buffer; mimeType: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const prompt =
    params.mode === "enhance"
      ? buildEnhancePrompt(params)
      : buildGeneratePrompt(params);

  if (params.mode === "enhance" && !params.existingImageUrl) {
    throw new Error("existingImageUrl is required for enhance mode");
  }

  // For enhance mode the model takes both the source image and the prompt.
  // For generate mode it's text-only.
  const content =
    params.mode === "enhance"
      ? [
          { type: "image_url", image_url: { url: params.existingImageUrl! } },
          { type: "text", text: prompt },
        ]
      : prompt;

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      // OpenRouter recommends these for analytics + abuse handling.
      "HTTP-Referer": "https://tokoflow.com",
      "X-Title": "Tokoflow",
    },
    body: JSON.stringify({
      model: MODEL_ID,
      messages: [{ role: "user", content }],
      modalities: ["image", "text"],
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`OpenRouter ${response.status}: ${text.slice(0, 300)}`);
  }

  const data = (await response.json()) as OpenRouterImageResponse;
  if (data.error) {
    throw new Error(`OpenRouter error: ${data.error.message ?? "unknown"}`);
  }

  const dataUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!dataUrl) {
    throw new Error("OpenRouter returned no image");
  }

  // Parse "data:image/png;base64,..." → buffer + mime
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    throw new Error("OpenRouter returned an unrecognised image format");
  }
  const mimeType = match[1];
  const buffer = Buffer.from(match[2], "base64");

  return { buffer, mimeType };
}
