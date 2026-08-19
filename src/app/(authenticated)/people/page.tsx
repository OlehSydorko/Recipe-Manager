'use client';

import { Suspense } from 'react';
import { FindPeopleSearch } from '@/features/profile/components/FindPeopleSearch';
import { useSearchParams } from 'next/navigation';

export default function PeoplePage() {
    return (
        <Suspense fallback={null}>
            <PeoplePageContent />
        </Suspense>
    );
}

function PeoplePageContent() {
    const searchParams = useSearchParams();

    return (
        <div>
            <FindPeopleSearch initialQuery={searchParams.get('q') ?? ''} />
        </div>
    );
}
