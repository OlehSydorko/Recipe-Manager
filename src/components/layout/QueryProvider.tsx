'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const DEFAULT_STALE_TIME_MS = 5 * 60 * 1000;

export function QueryProvider({ children }: Readonly<{ children: React.ReactNode }>) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: DEFAULT_STALE_TIME_MS
                    }
                }
            })
    );

    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
