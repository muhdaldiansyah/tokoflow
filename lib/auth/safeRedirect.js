export function safeRedirect(raw, fallback = '/dashboard') {
  if (typeof raw !== 'string') return fallback
  // allow only same-origin relative paths like "/dashboard" (not "//evil.com")
  return raw.startsWith('/') && !raw.startsWith('//') ? raw : fallback
}