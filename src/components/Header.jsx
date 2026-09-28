'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarCheck, CalendarDays, Moon, ShieldCheck, Sun } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { PREF_COOKIES, setPrefCookie } from '@/lib/prefs';

const iconButton =
  'rounded-xl bg-neutral-100 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all shadow-sm';

export default function Header({ showAdmin, initialTheme }) {
  const { t, lang, setLang } = useI18n();
  const pathname = usePathname();
  const [theme, setTheme] = useState(initialTheme || 'light');

  useEffect(() => {
    if (!initialTheme) setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  }, [initialTheme]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    setPrefCookie(PREF_COOKIES.theme, next);
    setTheme(next);
  };

  const tabs = [
    { href: '/', label: t('tab.schedule'), icon: CalendarDays },
    { href: '/admin', label: t('tab.admin'), icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-900 px-4 py-3.5">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <Link href="/" className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="w-10 h-10 rounded-xl bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center text-white dark:text-neutral-950 shadow-md">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-neutral-900 dark:text-white tracking-tight font-outfit m-0 leading-none uppercase">
              {t('app.title')}
            </h1>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-semibold tracking-wider uppercase mt-1">
              {t('app.subtitle')}
            </p>
          </div>
        </Link>

        <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
          {showAdmin && (
            <nav className="flex-grow sm:flex-grow-0 flex bg-neutral-100 dark:bg-neutral-900/60 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800/80">
              {tabs.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex-grow sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    pathname === href
                      ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 shadow-sm'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </Link>
              ))}
            </nav>
          )}
          <button
            type="button"
            onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}
            aria-label={t('app.language')}
            title={t('app.language')}
            className={`${iconButton} px-3 py-2 text-xs font-bold`}
          >
            {lang === 'tr' ? 'EN' : 'TR'}
          </button>
          <button type="button" onClick={toggleTheme} aria-label={t('app.toggleTheme')} className={`${iconButton} p-2.5`}>
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
