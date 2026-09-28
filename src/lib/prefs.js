export const LANGS = ['en', 'tr'];

export const PREF_COOKIES = { lang: 'owp.lang', theme: 'owp.theme', team: 'owp.team' };

export function pickLanguage(cookieValue) {
  return LANGS.includes(cookieValue) ? cookieValue : 'tr';
}

// Browser-only.
export function setPrefCookie(name, value) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
}
