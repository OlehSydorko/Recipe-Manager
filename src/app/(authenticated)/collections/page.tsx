'use client';

import { Suspense } from 'react';
import { CollectionsSection } from '@/features/collections/components/CollectionsSection';
import { useHasMounted } from '@/hooks/useHasMounted';
import { useCurrentProfile } from '@/hooks/useProfile';
import { Folder } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function CollectionsPage() {
    return (
        <Suspense fallback={null}>
            <CollectionsPageContent />
        </Suspense>
    );
}

function CollectionsPageContent() {
    const hasMounted = useHasMounted();
    const { data: profile, isPending } = useCurrentProfile();
    const searchParams = useSearchParams();
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
                    href='/login?redirect=%2Fcollections'
                    className='mt-2 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-button font-medium text-accent-foreground shadow-sm transition-colors duration-150 hover:bg-accent-hover'
                >
                    Sign in
                </Link>
            </div>
        );
    }

    return (
        <div>
            <CollectionsSection initialQuery={searchParams.get('q') ?? ''} />
        </div>
    );
}
