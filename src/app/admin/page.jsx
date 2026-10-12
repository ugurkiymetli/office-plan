import AdminApp from '@/components/AdminApp';
import LoginForm from '@/components/LoginForm';
import { getAdminSession } from '@/lib/auth';
import { getPlan } from '@/lib/db';

export const metadata = { title: 'Yönetim', robots: { index: false, follow: false } };

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <LoginForm />
      </div>
    );
  }
  return (
    <div className="mx-auto w-full max-w-4xl">
      <AdminApp initialPlan={await getPlan()} username={session.username} />
    </div>
  );
}
