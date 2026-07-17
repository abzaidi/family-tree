import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { I18nProvider } from '@/lib/i18n/context';
import { AdminUsersClient } from '@/components/admin/AdminUsersClient';
import { ThemeToaster } from '@/components/theme/theme-toaster';
import type { AppUser } from '@/types';

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (roleRow?.role !== 'admin') {
    redirect('/');
  }

  const { data: users, error } = await supabase.rpc('list_app_users');

  return (
    <I18nProvider>
      <AdminUsersClient
        initialUsers={(users as AppUser[] | null) ?? []}
        initialError={error?.message ?? null}
      />
      <ThemeToaster />
    </I18nProvider>
  );
}
