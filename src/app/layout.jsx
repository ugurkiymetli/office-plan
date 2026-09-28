import { cookies } from 'next/headers';
import { Inter, Outfit } from 'next/font/google';
import Header from '@/components/Header';
import { I18nProvider } from '@/lib/i18n';
import { hasSessionCookie } from '@/lib/auth';
import { PREF_COOKIES, pickLanguage } from '@/lib/prefs';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'latin-ext'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin', 'latin-ext'], variable: '--font-outfit-family' });

const SITE_NAME = 'Ofis Planı';
const DESCRIPTION = 'Bugün ofiste mi, evde mi? Takımının güncel ofis, ev ve tatil günlerini tek bakışta gör.';

function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return 'http://localhost:3000';
}

export const metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  appleWebApp: { title: SITE_NAME, statusBarStyle: 'black-translucent' },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: DESCRIPTION,
    locale: 'tr_TR',
    alternateLocale: ['en_US'],
  },
  twitter: { card: 'summary_large_image', title: SITE_NAME, description: DESCRIPTION },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0a0a0a',
};

// Applies the system theme before paint when the user hasn't picked one yet.
const THEME_SCRIPT = `if(!document.cookie.includes('${PREF_COOKIES.theme}=')&&matchMedia('(prefers-color-scheme: dark)').matches)document.documentElement.classList.add('dark')`;

function adminTabEnabled() {
  const flag = process.env.SHOW_ADMIN_TAB;
  return flag ? flag === 'true' : process.env.NODE_ENV !== 'production';
}

export default async function RootLayout({ children }) {
  const store = await cookies();
  const lang = pickLanguage(store.get(PREF_COOKIES.lang)?.value);
  const theme = store.get(PREF_COOKIES.theme)?.value;
  const showAdmin = adminTabEnabled() || (await hasSessionCookie());

  return (
    <html
      lang={lang}
      className={`${inter.variable} ${outfit.variable} ${theme === 'dark' ? 'dark' : ''}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="font-sans antialiased">
        <I18nProvider initialLang={lang}>
          <div className="min-h-screen flex flex-col justify-between pb-12 bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 transition-colors duration-300">
            <Header showAdmin={showAdmin} initialTheme={theme === 'dark' || theme === 'light' ? theme : null} />
            <main className="flex-grow max-w-4xl w-full mx-auto px-4 py-6 md:py-8 space-y-8">{children}</main>
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
