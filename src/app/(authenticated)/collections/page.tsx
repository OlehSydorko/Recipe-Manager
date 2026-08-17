'use client';

import { CollectionsSection } from '@/features/collections/components/CollectionsSection';
import { useHasMounted } from '@/hooks/useHasMounted';
import { useCurrentProfile } from '@/hooks/useProfile';
import { Folder } from 'lucide-react';
import Link from 'next/link';

// Guests have no "my collections" to show here -- there's no community
// collections feed in this pass (see GUEST_ACCESS_PLAN.md), so rather than
// render an empty grid with a gate-on-click button, guests get a direct
// sign-up prompt instead. A public collection someone shares a link to is
// still viewable directly at /collections/[id] regardless of this page.
export default function CollectionsPage() {
    const hasMounted = useHasMounted();
    const { data: profile, isPending } = useCurrentProfile();
    // hasMounted-gated so the client's first paint always matches the
    // server (which never resolves this) -- see useHasMounted for why.
    const isGuest = hasMounted && !isPending && !profile;

    if (isGuest) {
        return (
            <div className='mt-16 flex flex-col items-center gap-3 text-center'>
                <Folder size={32} className='text-text-disabled' />
                <p className='text-h3 font-medium text-text-primary'>Sign up to create collections</p>
                <p className='max-w-sm text-body text-text-secondary'>
                    Collections let you group your recipes together, like &quot;weeknight dinners&quot; or &quot;meal
                    prep&quot;.
                </p>
                <Link
                    href='/signup?redirect=%2Fcollections'
                    className='mt-2 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-button font-medium text-accent-foreground shadow-sm transition-colors duration-150 hover:bg-accent-hover'
                >
                    Sign up
                </Link>
            </div>
        );
    }

    return (
        <div>
            <CollectionsSection />
        </div>
    );
}
