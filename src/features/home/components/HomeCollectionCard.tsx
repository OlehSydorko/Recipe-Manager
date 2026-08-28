'use client';

import { CollectionCoverMosaic } from '@/features/collections/components/CollectionCoverMosaic';
import { useCollectionCoverUrls } from '@/hooks/useCollections';
import type { CollectionWithCount } from '@/types/collection';
import Link from 'next/link';

type HomeCollectionCardProps = {
    collection: CollectionWithCount;
};

export function HomeCollectionCard({ collection }: HomeCollectionCardProps) {
    const { data: coverUrls } = useCollectionCoverUrls(collection.coverImagePaths);
    const cellUrls = collection.coverImagePaths.map((path) => coverUrls?.[path]);

    return (
        <Link
            href='/collections'
            className='block overflow-hidden rounded-lg border border-border bg-surface shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md'
        >
            <div className='relative aspect-[4/3] w-full bg-bg-secondary'>
                <CollectionCoverMosaic imageUrls={cellUrls} />

                <span className='absolute bottom-2 left-2 rounded-full bg-bg/70 px-2.5 py-0.5 text-caption font-medium text-text-primary backdrop-blur-sm'>
                    {collection.recipeCount} {collection.recipeCount === 1 ? 'recipe' : 'recipes'}
                </span>
            </div>

            <div className='p-4'>
                <h3 className='truncate text-h3 font-medium text-text-primary'>{collection.name}</h3>
            </div>
        </Link>
    );
}
