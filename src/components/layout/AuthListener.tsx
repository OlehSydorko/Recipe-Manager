'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';

export function AuthListener() {
    const queryClient = useQueryClient();

    useEffect(() => {
        const supabase = createClient();

        const {
            data: { subscription }
        } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_OUT') {
                queryClient.clear();
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                queryClient.invalidateQueries();
            }
        });

        return () => subscription.unsubscribe();
    }, [queryClient]);

    return null;
}
