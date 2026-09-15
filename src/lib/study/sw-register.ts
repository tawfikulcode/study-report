export function registerStudyWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  try {
    if (window.self !== window.top) return;
  } catch {
    return;
  }
  void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
}
