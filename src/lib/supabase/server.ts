import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function createMockClient() {
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

export async function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
        return createMockClient();
    }

    const cookieStore = await cookies();

    return createServerClient(url, key, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    );
                } catch {
                    // The `setAll` method was called from a Server Component.
                }
            },
        },
    });
}
