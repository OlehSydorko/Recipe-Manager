'use client';

import { ActionMenu } from '@/components/ui/ActionMenu';
import { useCollectionCoverUrls } from '@/hooks/useCollections';
import type { CollectionWithCount } from '@/types/collection';
import { Folder } from 'lucide-react';
import Link from 'next/link';

type CollectionListRowProps = {
    collection: CollectionWithCount;
    onEdit: () => void;
    onDelete: () => void;
    hideActions?: boolean;
};

export function CollectionListRow({ collection, onEdit, onDelete, hideActions }: CollectionListRowProps) {
    const { data: coverUrls } = useCollectionCoverUrls(collection.coverImagePaths);

    const thumbnailUrl = coverUrls?.[collection.coverImagePaths[0]];

    return (
        <div className='relative flex items-center gap-4 rounded-lg border border-border bg-surface p-3 transition-colors duration-150 hover:border-border-strong'>
            {/* Link overlay covers the whole row so it stays clickable everywhere except
                the action menu below, which sits above it (z-20) in its own stacking layer. */}
            <Link
                href={`/collections/${collection.id}`}
                aria-label={collection.name}
                className='absolute inset-0 z-0'
            />

            <div className='pointer-events-none relative z-10 flex min-w-0 flex-1 items-center gap-4'>
                <div className='h-16 w-16 shrink-0 overflow-hidden rounded-md bg-bg-secondary'>
                    {thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumbnailUrl} alt='' className='h-full w-full object-cover' />
                    ) : (
                        <div className='flex h-full w-full items-center justify-center text-text-disabled'>
                            <Folder size={18} />
                        </div>
                    )}
                </div>

                <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-2'>
                        <h3 className='truncate text-h3 font-medium text-text-primary'>{collection.name}</h3>
                        {collection.is_public && (
                            <span className='shrink-0 rounded-full bg-accent-muted px-2 py-0.5 text-caption font-medium text-accent'>
                                Public
                            </span>
                        )}
                    </div>
                    {collection.description && (
                        <p className='truncate text-caption text-text-secondary'>{collection.description}</p>
                    )}
                </div>

                <span className='shrink-0 text-caption text-text-disabled'>
                    {collection.recipeCount} {collection.recipeCount === 1 ? 'recipe' : 'recipes'}
                </span>
            </div>

            {!hideActions && (
                <div className='relative z-20'>
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
