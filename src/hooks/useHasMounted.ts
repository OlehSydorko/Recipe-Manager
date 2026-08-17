import { useEffect, useState } from 'react';

// Returns false on the server and during the client's very first render (so
// it always matches the server-rendered HTML), then flips to true right
// after mount. Anything that branches its rendered output on client-only
// data (like whether a Supabase session exists) must gate on this first --
// otherwise, if that data resolves before React finishes comparing the
// hydrated tree, the client's first paint can diverge from the server's and
// React throws a hydration mismatch.
export function useHasMounted(): boolean {
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    return hasMounted;
}
