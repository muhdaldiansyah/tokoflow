// Centralized model config for every OpenRouter LLM call (text + vision).
//
// Single source of truth so changing the model is a one-line edit here instead
// of a hunt across every AI route. Pass `AI_TEXT_MODELS` as the request body's
// `models` array (NOT `model`) so OpenRouter fails over automatically when the
// primary is rate-limited or temporarily unavailable —
// https://openrouter.ai/docs/guides/routing/model-fallbacks
//
// Primary: Gemini 3.5 Flash. Fallback: the stable Gemini 2.5 Flash, so a
// transient outage or rate-limit on the primary doesn't take down order
// parsing, photo magic, recap, and receipt triage all at once.

export const AI_TEXT_MODEL = "google/gemini-3.5-flash";

export const AI_TEXT_MODELS = [AI_TEXT_MODEL, "google/gemini-2.5-flash"];
