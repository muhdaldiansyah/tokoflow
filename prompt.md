You are a repository auditor.
STRICT RULES:
- Do NOT suggest changes or advice.
- Only report PASS/FAIL with evidence (file paths + short code excerpts).
- Output JSON ONLY.

## Objective
Re-verify the current authentication implementation and confirm each criterion below strictly by reading the codebase (no runtime). Provide PASS/FAIL per item with concrete evidence lines.

## Criteria (check all)

1) Middleware guard behavior
   - Uses createServerClient.
   - Redirects unauth → /login?redirect=<full path+query>.
   - Redirects auth → /dashboard.
   - Preserves querystring in redirect.
   - Copies/propagates Supabase cookies on redirects.

2) Login flow
   - Uses server action signIn from app/actions/auth.js.
   - After success, navigates via router.replace(<sanitized value>).
   - Reads ?redirect= and sanitizes it via a helper that only allows relative same-origin paths (starts with '/' and not '//').

3) Register flow
   - Uses server action signUp from app/actions/auth.js.
   - Sends metadata keys: full_name, business_name.
   - On success, navigates to /login?registered=true (or equivalent code-evidenced behavior).

4) Logout
   - A server-side logout route exists at app/logout/route.js.
   - It constructs a Supabase SSR client with cookies get/set/remove.
   - Calls supabase.auth.signOut() and redirects to /login.

5) OAuth callback
   - Route exists at app/auth/callback/route.js.
   - Exchanges code for session (or relies on Supabase cookies) and redirects to /dashboard.

6) Single context provider in use
   - Auth context exports: user, session, profile, loading, signOut, createProfile, updateProfile.
   - Subscribes to supabase.auth.onAuthStateChange.
   - Fetches av_profiles for the signed-in user.
   - No aggressive localStorage/cookie clearing inside the context.

7) Re-exported hook unification
   - app/hooks/useAuthSimple.js re-exports the same context (AuthProvider, useAuth).
   - Any hook named useAuth.js is removed or unused.

8) Safe redirect helper present and used
   - lib/auth/safeRedirect.js exists.
   - Login page imports/uses it to sanitize the redirect parameter.

9) Profile operations
   - app/actions/profile.js contains createProfile (upsert/create) and updateProfile server actions.
   - app/actions/auth.js no longer inserts directly into av_profiles on signUp.
   - Context uses server actions for profile create/update.

10) Private layout
   - app/(private)/layout.js does NOT perform client-side redirecting; it only shows a loading state (e.g., AuthLoading) while checking.

## Evidence Requirements
For each PASSED item, include at least one evidence object:
{ "path": "<file>", "lines": "<short snippet or line range proving it>" }
Keep snippets under ~20 lines.

## Output Format (JSON ONLY)

{
  "summary": {
    "passCount": <number>,
    "failCount": <number>
  },
  "checks": [
    {
      "name": "Middleware guard behavior",
      "result": "PASS|FAIL",
      "evidence": [{ "path": "string", "lines": "string" }]
    },
    {
      "name": "Login flow",
      "result": "PASS|FAIL",
      "evidence": [{ "path": "string", "lines": "string" }]
    },
    {
      "name": "Register flow",
      "result": "PASS|FAIL",
      "evidence": [{ "path": "string", "lines": "string" }]
    },
    {
      "name": "Logout route",
      "result": "PASS|FAIL",
      "evidence": [{ "path": "string", "lines": "string" }]
    },
    {
      "name": "OAuth callback",
      "result": "PASS|FAIL",
      "evidence": [{ "path": "string", "lines": "string" }]
    },
    {
      "name": "Single context provider",
      "result": "PASS|FAIL",
      "evidence": [{ "path": "string", "lines": "string" }]
    },
    {
      "name": "Hook re-export unification",
      "result": "PASS|FAIL",
      "evidence": [{ "path": "string", "lines": "string" }]
    },
    {
      "name": "Safe redirect helper usage",
      "result": "PASS|FAIL",
      "evidence": [{ "path": "string", "lines": "string" }]
    },
    {
      "name": "Profile server actions only",
      "result": "PASS|FAIL",
      "evidence": [{ "path": "string", "lines": "string" }]
    },
    {
      "name": "Private layout simplified",
      "result": "PASS|FAIL",
      "evidence": [{ "path": "string", "lines": "string" }]
    }
  ]
}
