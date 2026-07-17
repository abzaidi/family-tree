'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Shield, TreePine, Users } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n/context';
import { LanguageSwitch } from '@/components/nav/LanguageSwitch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AppUser, UserRole } from '@/types';

const ROLES: UserRole[] = ['viewer', 'editor', 'admin'];

interface AdminUsersClientProps {
  initialUsers: AppUser[];
  initialError?: string | null;
}

export function AdminUsersClient({
  initialUsers,
  initialError = null,
}: AdminUsersClientProps) {
  const { t, dir } = useI18n();
  const { user } = useAuth();
  const [users, setUsers] = useState<AppUser[]>(initialUsers);
  const [loading, setLoading] = useState(false);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(initialError);

  const loadUsers = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error: loadError } = await supabase.rpc('list_app_users');

    if (loadError) {
      setError(loadError.message || t('toast.error'));
      toast.error(loadError.message || t('toast.error'));
    } else {
      setError(null);
      setUsers((data as AppUser[]) ?? []);
    }
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const previous = users.find((u) => u.id === userId);
    if (!previous || previous.role === newRole) return;

    setSavingUserId(userId);
    setUsers((current) =>
      current.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );

    const supabase = createClient();
    const { error: saveError } = await supabase.rpc('set_app_user_role', {
      target_user_id: userId,
      new_role: newRole,
    });

    if (saveError) {
      setUsers((current) =>
        current.map((u) =>
          u.id === userId ? { ...u, role: previous.role } : u
        )
      );
      toast.error(saveError.message || t('toast.error'));
    } else {
      toast.success(t('toast.saved'));
    }

    setSavingUserId(null);
  };

  const formatDate = (value: string) => {
    try {
      return new Date(value).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return value;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50" dir={dir}>
      <header className="sticky top-0 z-20 border-b border-emerald-100/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-emerald-50"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{t('admin.backToTree')}</span>
            </Link>
            <div className="hidden h-5 w-px bg-emerald-100 sm:block" />
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 text-white">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-gray-900 sm:text-base">
                  {t('admin.usersTitle')}
                </h1>
                <p className="hidden text-xs text-gray-500 sm:block">
                  {t('admin.usersSubtitle')}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitch />
            <Link
              href="/"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50"
            >
              <TreePine className="h-4 w-4" />
              <span className="hidden sm:inline">{t('app.title')}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-gray-600">
            {loading
              ? t('state.loading')
              : t('admin.userCount', { count: users.length })}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadUsers()}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t('admin.refresh')
            )}
          </Button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-500">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              <p className="text-sm">{t('state.loading')}</p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-20 text-center text-gray-500">
              <Users className="h-8 w-8 text-emerald-400" />
              <p className="text-sm font-medium">{t('admin.noUsers')}</p>
            </div>
          ) : (
            <>
              <div className="hidden grid-cols-[minmax(0,1.3fr)_minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,1.2fr)] gap-4 border-b border-emerald-50 bg-emerald-50/50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 md:grid">
                <span>{t('admin.name')}</span>
                <span>{t('admin.email')}</span>
                <span>{t('admin.joined')}</span>
                <span>{t('admin.role')}</span>
              </div>
              <ul className="divide-y divide-emerald-50">
                {users.map((appUser) => {
                  const isCurrentUser = user?.id === appUser.id;
                  const isSaving = savingUserId === appUser.id;

                  return (
                    <li
                      key={appUser.id}
                      className="grid grid-cols-1 gap-3 px-4 py-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,1.2fr)] md:items-center md:gap-4"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {appUser.name || t('admin.noName')}
                          </p>
                          {isCurrentUser && (
                            <Badge variant="secondary" className="text-xs">
                              {t('admin.you')}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm text-gray-700">
                          {appUser.email || t('admin.noEmail')}
                        </p>
                        <p className="mt-0.5 truncate font-mono text-xs text-gray-400">
                          {appUser.id}
                        </p>
                      </div>

                      <div className="text-sm text-gray-600">
                        <span className="mr-2 text-xs font-semibold uppercase tracking-wide text-gray-400 md:hidden">
                          {t('admin.joined')}
                        </span>
                        {formatDate(appUser.created_at)}
                      </div>

                      <div className="flex items-center gap-2">
                        <Select
                          value={appUser.role}
                          onValueChange={(value) => {
                            if (value) {
                              void handleRoleChange(
                                appUser.id,
                                value as UserRole
                              );
                            }
                          }}
                          disabled={isSaving}
                        >
                          <SelectTrigger className="w-full min-w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map((role) => (
                              <SelectItem key={role} value={role}>
                                <span className="inline-flex items-center gap-1.5">
                                  <Shield className="h-3.5 w-3.5" />
                                  {t(`role.${role}`)}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {isSaving && (
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-emerald-600" />
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
