import type { CollectionWithCount } from '@/types/collection';
import { Folder } from 'lucide-react';
import Link from 'next/link';

type HomeCollectionCardProps = {
    collection: CollectionWithCount;
};

// Read-only summary tile for the Home dashboard. Deliberately not reusing
// CollectionCard, which always renders an edit/delete ActionMenu — that
// management UI belongs on the collection page's Collections tab, not here.
export function HomeCollectionCard({ collection }: HomeCollectionCardProps) {
    return (
        <Link
            href='/collections'
            className='block rounded-lg border border-border bg-surface p-4 transition-colors duration-150 hover:border-border-strong hover:bg-hover'
        >
            <Folder size={20} className='text-accent' />

            <h3 className='mt-3 truncate text-h3 font-medium text-text-primary'>{collection.name}</h3>

            <p className='mt-3 text-caption text-text-disabled'>
                {collection.recipeCount} {collection.recipeCount === 1 ? 'recipe' : 'recipes'}
            </p>
        </Link>
    );
}
