'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, ShieldCheck } from 'lucide-react';
import { Card, Field } from './ui';
import { Input } from '@/components/arc/input/input';
import { Button } from '@/components/arc/button/button';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';

export default function LoginForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api('/api/login', { method: 'POST', body: JSON.stringify(form) });
      router.refresh();
    } catch (err) {
      setError(err.status === 429 ? t('login.locked') : err.status === 401 ? t('login.invalid') : t('login.failed', { error: err.message }));
      setForm((f) => ({ ...f, password: '' }));
      setBusy(false);
    }
  };

  return (
    <Card icon={ShieldCheck} title={t('login.title')} className="max-w-md mx-auto">
      <form onSubmit={submit} className="space-y-4">
        <Field label={t('login.username')}>
          <Input
            value={form.username}
            autoComplete="username"
            maxLength={64}
            autoFocus
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
        </Field>
        <Field label={t('login.password')}>
          <Input
            type="password"
            value={form.password}
            autoComplete="current-password"
            maxLength={256}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </Field>
        <Button type="submit" variant="primary" size="md" disabled={busy || !form.username || !form.password} className="w-full">
          <LogIn className="w-4 h-4" /> {busy ? t('login.signingIn') : t('login.submit')}
        </Button>
        {error && <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{error}</p>}
      </form>
    </Card>
  );
}
