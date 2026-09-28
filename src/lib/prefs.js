export const LANGS = ['en', 'tr'];

export const PREF_COOKIES = { lang: 'owp.lang', theme: 'owp.theme', team: 'owp.team' };

export function pickLanguage(cookieValue, acceptLanguage = '') {
  if (LANGS.includes(cookieValue)) return cookieValue;
  return /^tr\b/i.test(acceptLanguage.trim()) ? 'tr' : 'en';
}

// Browser-only.
export function setPrefCookie(name, value) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
}
