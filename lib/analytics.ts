import { createClient } from "@/lib/supabase/client";

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;
const UTM_SESSION_KEY = "catatorder_utm";

function captureUtmParams(): Record<string, string> | undefined {
  if (typeof window === "undefined") return undefined;

  // Return cached UTM if already captured this session
  const cached = sessionStorage.getItem(UTM_SESSION_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      return Object.keys(parsed).length > 0 ? parsed : undefined;
    } catch {
      return undefined;
    }
  }

  // Capture from URL on first call
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) utm[key] = value;
  }

  sessionStorage.setItem(UTM_SESSION_KEY, JSON.stringify(utm));
  return Object.keys(utm).length > 0 ? utm : undefined;
}

export function track(event: string, properties?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;

  const supabase = createClient();
  const utm = captureUtmParams();

  const merged = {
    ...properties,
    ...(utm ? { utm } : {}),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase.auth.getUser().then(({ data }: any) => {
    if (!data?.user) return;
    const user = data.user;
    supabase
      .from("events")
      .insert({
        user_id: user.id,
        event,
        properties: Object.keys(merged).length > 0 ? merged : {},
      })
      .then(() => {});
  }).catch(() => {});
}
