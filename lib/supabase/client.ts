import { createBrowserClient } from "@supabase/ssr";
import { APP_SCHEMA } from "./config";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: any = null;

export function createClient() {
  if (client) return client;

   
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db: { schema: APP_SCHEMA as any },
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    }
  );

  return client;
}
