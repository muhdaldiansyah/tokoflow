let installed = false;
export function installKeepAlive() {
  if (installed || typeof window !== 'undefined') return; // Skip on client side
  installed = true;

  try {
    // Use dynamic import for undici to avoid bundling issues
    import('undici').then(({ setGlobalDispatcher, Agent }) => {
      setGlobalDispatcher(new Agent({
        keepAliveTimeout: 30_000,
        keepAliveMaxTimeout: 120_000,
        pipelining: 1
      }));
    }).catch(() => {
      // Fallback: undici not available, keep-alive disabled
      console.warn('Keep-alive disabled: undici not available');
    });
  } catch {
    // Keep-alive disabled if undici not available
  }
}