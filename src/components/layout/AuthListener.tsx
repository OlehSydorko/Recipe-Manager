'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';

// Reacts to Supabase auth state changes so the client-side React Query cache
// (Nav, useRequireAuth, "my recipes"/categories/collections/favorites, ...)
// stays in sync with the session. Without this, sign-in/sign-out only takes
// effect after a full page reload recreates the QueryClient -- none of those
// queries are keyed by user id, and router.refresh() only re-runs server
// components, not the client-side cache. Mounted once in the root layout.
export function AuthListener() {
    const queryClient = useQueryClient();

    useEffect(() => {
        const supabase = createClient();

        const {
            data: { subscription }
        } = supabase.auth.onAuthStateChange((event) => {
            // Skip INITIAL_SESSION -- that's just the first render reporting
            // the session it already fetched, not a change to react to.
            if (event === 'SIGNED_OUT') {
                // Clear rather than invalidate: purges any cached data
                // belonging to the previous user (my recipes, categories,
                // collections, ...) so it can't leak to the next guest/user
                // on a shared device.
                queryClient.clear();
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                queryClient.invalidateQueries();
            }
        });

        return () => subscription.unsubscribe();
    }, [queryClient]);

    return null;
}
