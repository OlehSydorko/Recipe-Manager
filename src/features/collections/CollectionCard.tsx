'use client';

import { ActionMenu } from '@/components/ui/ActionMenu';
import { useCollectionCoverUrls } from '@/hooks/useCollections';
import type { CollectionWithCount } from '@/types/collection';
import Link from 'next/link';
import { CollectionCoverMosaic } from './CollectionCoverMosaic';

type CollectionCardProps = {
    collection: CollectionWithCount;
    onEdit: () => void;
    onDelete: () => void;
    hideActions?: boolean;
};

export function CollectionCard({ collection, onEdit, onDelete, hideActions }: CollectionCardProps) {
    const { data: coverUrls } = useCollectionCoverUrls(collection.coverImagePaths);
    const cellUrls = collection.coverImagePaths.map((path) => coverUrls?.[path]);

    return (
        <div className='group relative overflow-hidden rounded-lg border border-border bg-surface shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md'>
            {/* Link overlay covers the whole card so it stays clickable everywhere except
                the action menu below, which sits above it (z-20) in its own stacking layer. */}
            <Link
                href={`/collections/${collection.id}`}
                aria-label={collection.name}
                className='absolute inset-0 z-0'
            />

            <div className='pointer-events-none relative z-10'>
                <div className='relative aspect-[4/3] w-full bg-bg-secondary'>
                    <CollectionCoverMosaic imageUrls={cellUrls} />

                    <span className='absolute bottom-2 left-2 rounded-full bg-bg/70 px-2.5 py-0.5 text-caption font-medium text-text-primary backdrop-blur-sm'>
                        {collection.recipeCount} {collection.recipeCount === 1 ? 'recipe' : 'recipes'}
                    </span>
                </div>

                <div className='p-4'>
                    <h3 className='mt-3 truncate pr-8 text-h3 font-medium text-text-primary'>{collection.name}</h3>
                    {collection.description && (
                        <p className='mt-1 line-clamp-2 text-caption text-text-secondary'>{collection.description}</p>
                    )}
                </div>
            </div>

            {!hideActions && (
                <div className='absolute right-2 top-2 z-20 rounded-full bg-bg/70 backdrop-blur-sm'>
                    <ActionMenu
                        ariaLabel={`Actions for ${collection.name}`}
                        items={[
                            { label: 'Edit', onSelect: onEdit },
                            { label: 'Delete', onSelect: onDelete, variant: 'danger' }
                        ]}
                    />
                </div>
            )}
        </div>
    );
}
