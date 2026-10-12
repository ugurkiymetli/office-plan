'use client';

import { useEffect, useState } from 'react';
import { PERSONAL_PLAN_KEY, addPersonalOffDays, normalizePersonalPlan, updatePersonalPlan } from './personal-plan';

export function usePersonalPlan() {
  const [personalPlan, setPersonalPlan] = useState(() => normalizePersonalPlan(null));
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const load = () => {
      try {
        const saved = localStorage.getItem(PERSONAL_PLAN_KEY);
        setPersonalPlan(normalizePersonalPlan(saved ? JSON.parse(saved) : null));
        setMessage(null);
      } catch {
        setMessage('personal.loadError');
      }
      setReady(true);
    };
    load();
    const onStorage = (event) => {
      if (event.key === PERSONAL_PLAN_KEY || event.key === null) load();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const persist = (next) => {
    try {
      localStorage.setItem(PERSONAL_PLAN_KEY, JSON.stringify(next));
      setPersonalPlan(next);
      setMessage('personal.saved');
      return true;
    } catch {
      setMessage('personal.saveError');
      return false;
    }
  };

  const change = (teamId, kind, key, value) => persist(updatePersonalPlan(personalPlan, teamId, kind, key, value));
  const addOffDays = (teamId, start, end) => persist(addPersonalOffDays(personalPlan, teamId, start, end));
  const clear = (teamId) => {
    const teams = { ...personalPlan.teams };
    delete teams[teamId];
    return persist({ version: 1, teams });
  };

  return { personalPlan, ready, message, change, addOffDays, clear };
}