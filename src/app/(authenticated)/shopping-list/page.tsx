'use client';

import { ShoppingListSection } from '@/features/shopping-list/components/ShoppingListSection';
import { useHasMounted } from '@/hooks/useHasMounted';
import { useCurrentProfile } from '@/hooks/useProfile';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export default function ShoppingListPage() {
    const hasMounted = useHasMounted();
    const { data: profile, isPending } = useCurrentProfile();
    const isGuest = hasMounted && !isPending && !profile;

    if (isGuest) {
        return (
            <div className='mt-16 flex flex-col items-center gap-3 text-center'>
                <ShoppingCart size={32} className='text-text-disabled' />
                <p className='text-h3 font-medium text-text-primary'>Sign in to build a shopping list</p>
                <p className='max-w-sm text-body text-text-secondary'>
                    Add ingredients by hand, or pull them straight from a recipe, and check them off as you shop.
                </p>
                <Link
                    href='/login?redirect=%2Fshopping-list'
                    className='mt-2 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-button font-medium text-accent-foreground shadow-sm transition-colors duration-150 hover:bg-accent-hover'
                >
                    Sign in
                </Link>
            </div>
        );
    }

    return (
        <div>
            <ShoppingListSection />
        </div>
    );
}
