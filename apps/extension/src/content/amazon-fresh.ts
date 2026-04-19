try {
  console.log('[SafeSnack] content script injected');
} catch {
  // Never throw from content script entry — host page must keep working.
}
