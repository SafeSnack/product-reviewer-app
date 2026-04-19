try {
  console.log('[SafeSnack] content script injected');
  if (import.meta.env.DEV) {
    void import('./selectors/amazon.js')
      .then((m) => {
        try {
          m.logSelectorCoverage();
        } catch {
          // Diagnostics must never break the host page.
        }
      })
      .catch(() => {});
  }
} catch {
  // Never throw from content script entry — host page must keep working.
}
