'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { UserRole } from '@/types';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole>('viewer');
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                const { data } = await supabase
                    .from('user_roles')
                    .select('role')
                    .eq('user_id', user.id)
                    .single();
                setRole((data?.role as UserRole) || 'viewer');
            }
            setLoading(false);
        };

        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event: AuthChangeEvent, session: Session | null) => {
                setUser(session?.user ?? null);
                if (session?.user) {
                    const { data } = await supabase
                        .from('user_roles')
                        .select('role')
                        .eq('user_id', session.user.id)
                        .single();
                    setRole((data?.role as UserRole) || 'viewer');
                } else {
                    setRole('viewer');
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    }, []);

    const canEdit = role === 'editor' || role === 'admin';
    const isAdmin = role === 'admin';

    return { user, role, loading, signOut, canEdit, isAdmin };
}
