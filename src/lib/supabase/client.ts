'use client';

import { createBrowserClient } from '@supabase/ssr';

function createMockClient() {
    if (typeof window !== 'undefined') {
        console.warn(
            'Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY) are missing. Using a mock client.'
        );
    }

    const handler: ProxyHandler<any> = {
        get(target, prop) {
            if (prop === 'then') return undefined;

            if (prop === 'auth') {
                return {
                    getUser: async () => ({ data: { user: null }, error: null }),
                    onAuthStateChange: () => ({
                        data: { subscription: { unsubscribe: () => { } } },
                    }),
                    signOut: async () => ({ error: null }),
                };
            }

            const chain: any = () => { };
            chain.then = (onfulfilled: any) => {
                const result = { data: null, error: null };
                return Promise.resolve(onfulfilled ? onfulfilled(result) : result);
            };

            return new Proxy(chain, handler);
        },
        apply(target, thisArg, argumentsList) {
            const chain: any = () => { };
            chain.then = (onfulfilled: any) => {
                const result = { data: null, error: null };
                return Promise.resolve(onfulfilled ? onfulfilled(result) : result);
            };
            return new Proxy(chain, handler);
        },
    };

    return new Proxy({} as any, handler);
}

export function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
        return createMockClient();
    }
    return createBrowserClient(url, key);
}
