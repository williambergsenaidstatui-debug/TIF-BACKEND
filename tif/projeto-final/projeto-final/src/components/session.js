export async function readSession() {
  try { return window.sessionStorage.getItem('verify-system-session'); } catch { return null; }
}
export async function saveSession(value) {
  if (value) window.sessionStorage.setItem('verify-system-session', value);
  else window.sessionStorage.removeItem('verify-system-session');
}
