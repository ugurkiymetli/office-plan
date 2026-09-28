import { useCallback, useEffect, useState } from 'react';
import { CalendarCheck, CalendarDays, Moon, ShieldCheck, Sun } from 'lucide-react';
import ScheduleView from './components/ScheduleView';
import AdminView from './components/AdminView';
import { createDefaultPlan, normalizePlan } from './lib/schedule';

const KEYS = { team: 'owp.team', theme: 'owp.theme', draft: 'owp.planDraft', tab: 'owp.tab' };

function readDraft() {
  try {
    const raw = localStorage.getItem(KEYS.draft);
    return raw ? normalizePlan(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

async function fetchPublished() {
  for (const url of ['/api/plan', './plan.json']) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        return normalizePlan(await res.json());
      }
    } catch {
      // Try the next source, then fall back to the built-in plan.
    }
  }
  return createDefaultPlan();
}

async function savePublished(plan, password) {
  const res = await fetch('/api/plan', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` },
    body: JSON.stringify(plan),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(body.error || `HTTP ${res.status}`), { status: res.status });
  return normalizePlan(body);
}

export default function App() {
  const [plan, setPlan] = useState(readDraft);
  const [isDraft, setIsDraft] = useState(() => plan !== null);
  const [teamId, setTeamId] = useState(() => localStorage.getItem(KEYS.team));
  const [tab, setTab] = useState(() => localStorage.getItem(KEYS.tab) || 'schedule');
  const [theme, setTheme] = useState(() => (document.documentElement.classList.contains('dark') ? 'dark' : 'light'));

  useEffect(() => {
    if (!plan) fetchPublished().then(setPlan);
  }, [plan]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(KEYS.theme, theme);
  }, [theme]);

  useEffect(() => localStorage.setItem(KEYS.tab, tab), [tab]);

  const selectTeam = (id) => {
    setTeamId(id);
    localStorage.setItem(KEYS.team, id);
  };

  useEffect(() => {
    if (isDraft && plan) localStorage.setItem(KEYS.draft, JSON.stringify(plan));
  }, [plan, isDraft]);

  const updatePlan = useCallback((updater) => {
    setPlan((p) => ({ ...updater(p), updatedAt: new Date().toISOString() }));
    setIsDraft(true);
  }, []);

  const replacePlan = (next) => {
    setPlan(next);
    setIsDraft(true);
  };

  const discardDraft = () => {
    localStorage.removeItem(KEYS.draft);
    setIsDraft(false);
    setPlan(null);
  };

  const publishPlan = async (password) => {
    const saved = await savePublished(plan, password);
    localStorage.removeItem(KEYS.draft);
    setIsDraft(false);
    setPlan(saved);
  };

  const tabs = [
    { id: 'schedule', label: 'Schedule', icon: CalendarDays },
    { id: 'admin', label: 'Admin', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between pb-12 bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 transition-colors duration-300">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-900 px-4 py-3.5">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center text-white dark:text-neutral-950 shadow-md">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-neutral-900 dark:text-white tracking-tight font-outfit m-0 leading-none uppercase">
                Office Plan
              </h1>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-semibold tracking-wider uppercase mt-1">
                Office · Home · Holiday
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <nav className="flex-grow sm:flex-grow-0 flex bg-neutral-100 dark:bg-neutral-900/60 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800/80">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`flex-grow sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    tab === id
                      ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 shadow-sm'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </nav>
            <button
              type="button"
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              aria-label="Toggle theme"
              className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all shadow-sm"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-4xl w-full mx-auto px-4 py-6 md:py-8 space-y-8">
        {!plan ? (
          <p className="text-center text-sm text-neutral-500 dark:text-neutral-400 py-12">Loading plan…</p>
        ) : tab === 'schedule' ? (
          <ScheduleView plan={plan} teamId={teamId} onTeamChange={selectTeam} />
        ) : (
          <AdminView plan={plan} isDraft={isDraft} updatePlan={updatePlan} replacePlan={replacePlan} discardDraft={discardDraft} publishPlan={publishPlan} />
        )}
      </main>

      <footer className="text-center text-[11px] text-neutral-500 dark:text-neutral-400 px-4">
        {plan && `Plan updated ${new Date(plan.updatedAt).toLocaleDateString()}`}
      </footer>
    </div>
  );
}
