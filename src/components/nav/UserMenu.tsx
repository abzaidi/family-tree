'use client';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { LogIn, LogOut, Shield, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n/context';

export function UserMenu() {
    const { user, role, isAdmin, signOut } = useAuth();
    const { t } = useI18n();
    const router = useRouter();

    if (!user) {
        return (
            <Link
                href="/login"
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
            >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">{t('auth.login')}</span>
            </Link>
        );
    }

    const fullName =
        typeof user.user_metadata?.full_name === 'string'
            ? user.user_metadata.full_name.trim()
            : '';
    const initials = fullName
        ? fullName
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase()
        : (user.email || 'U')[0].toUpperCase();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                className="inline-flex items-center justify-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors focus:outline-none cursor-pointer"
            >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                    {initials}
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
                <div className="px-3 py-2">
                    {fullName && (
                        <p className="text-sm font-medium truncate">{fullName}</p>
                    )}
                    <p className={fullName ? 'text-xs text-gray-500 truncate' : 'text-sm font-medium truncate'}>
                        {user.email}
                    </p>
                    <Badge variant="secondary" className="mt-1 text-xs">
                        <Shield className="w-3 h-3 mr-1" />
                        {t(`role.${role}`)}
                    </Badge>
                </div>
                <DropdownMenuSeparator />
                {isAdmin && (
                    <DropdownMenuItem
                        onClick={() => router.push('/admin/users')}
                        className="cursor-pointer"
                    >
                        <Users className="w-4 h-4 mr-2" />
                        {t('nav.manageUsers')}
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={signOut} className="text-red-600 cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('auth.logout')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
