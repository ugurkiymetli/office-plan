'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminView from './AdminView';
import { ClientOnly, PlanFooter } from './ui';
import { api } from '@/lib/api';
import { createDefaultPlan, normalizePlan } from '@/lib/schedule';

const DRAFT_KEY = 'owp.planDraft';

function readDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? normalizePlan(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export default function AdminApp({ initialPlan, username }) {
  const router = useRouter();
  const [plan, setPlan] = useState(initialPlan);
  const [isDraft, setIsDraft] = useState(false);

  useEffect(() => {
    const draft = readDraft();
    if (draft) {
      setPlan(draft);
      setIsDraft(true);
    }
  }, []);

  useEffect(() => {
    if (isDraft) localStorage.setItem(DRAFT_KEY, JSON.stringify(plan));
  }, [plan, isDraft]);

  const updatePlan = useCallback((updater) => {
    setPlan((p) => ({ ...updater(p), updatedAt: new Date().toISOString() }));
    setIsDraft(true);
  }, []);

  const replacePlan = (next) => {
    setPlan(next);
    setIsDraft(true);
  };

  const discardDraft = async () => {
    localStorage.removeItem(DRAFT_KEY);
    setIsDraft(false);
    try {
      setPlan(normalizePlan(await api('/api/plan')));
    } catch (err) {
      if (err.status === 404) setPlan(createDefaultPlan());
      else throw err;
    }
  };

  const publishPlan = async () => {
    try {
      const saved = normalizePlan(await api('/api/plan', { method: 'PUT', body: JSON.stringify(plan) }));
      localStorage.removeItem(DRAFT_KEY);
      setIsDraft(false);
      setPlan(saved);
      router.refresh();
    } catch (err) {
      // Session expired or admin removed: the draft stays in localStorage and the page shows the login form.
      if (err.status === 401) router.refresh();
      throw err;
    }
  };

  const logout = async () => {
    await api('/api/login', { method: 'DELETE' });
    router.refresh();
  };

  return (
    <ClientOnly>
      <AdminView
        plan={plan}
        isDraft={isDraft}
        username={username}
        updatePlan={updatePlan}
        replacePlan={replacePlan}
        discardDraft={discardDraft}
        publishPlan={publishPlan}
        logout={logout}
      />
      <PlanFooter updatedAt={plan.updatedAt} />
    </ClientOnly>
  );
}
