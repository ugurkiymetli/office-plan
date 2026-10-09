'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarCheck, CalendarDays, ShieldCheck } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { PREF_COOKIES, setPrefCookie } from '@/lib/prefs';
import { ThemeSwitch } from '@/components/arc/theme-switch/theme-switch';
import { Button } from '@/components/arc/button/button';

export default function Header({ showAdmin, initialTheme }) {
  const { t, lang, setLang } = useI18n();
  const pathname = usePathname();
  const [theme, setTheme] = useState(initialTheme || 'light');

  useEffect(() => {
    if (!initialTheme) {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    }
  }, [initialTheme]);

  const handleThemeChange = (next) => {
    document.documentElement.classList.toggle('dark', next === 'dark');
    document.documentElement.dataset.theme = next;
    setPrefCookie(PREF_COOKIES.theme, next);
    setTheme(next);
  };

  const tabs = [
    { href: '/', label: t('tab.schedule'), icon: CalendarDays },
    { href: '/admin', label: t('tab.admin'), icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-900 px-4 py-2.5 sm:py-3.5">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center text-white dark:text-neutral-950 shadow-md">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-extrabold text-neutral-900 dark:text-white tracking-tight font-outfit m-0 leading-none uppercase truncate">
              {t('app.title')}
            </h1>
            <p className="hidden sm:block text-[10px] text-neutral-500 dark:text-neutral-400 font-semibold tracking-wider uppercase mt-1">
              {t('app.subtitle')}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {showAdmin && (
            <nav className="flex bg-neutral-100 dark:bg-neutral-900/60 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800/80">
              {tabs.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  aria-label={label}
                  title={label}
                  className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all ${
                    pathname === href
                      ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 shadow-sm'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              ))}
            </nav>
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}
            aria-label={t('app.language')}
            title={t('app.language')}
          >
            {lang === 'tr' ? 'EN' : 'TR'}
          </Button>
          <ThemeSwitch
            theme={theme}
            variant="rise"
            iconOnly
            onThemeChange={(next) => handleThemeChange(next)}
            label={t('app.toggleTheme')}
          />
        </div>
      </div>
    </header>
  );
}
