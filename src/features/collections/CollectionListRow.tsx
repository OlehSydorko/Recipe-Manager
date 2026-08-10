'use client';

import { ActionMenu } from '@/components/ui/ActionMenu';
import { useCollectionCoverUrls } from '@/hooks/useCollections';
import type { CollectionWithCount } from '@/types/collection';
import { Folder } from 'lucide-react';

type CollectionListRowProps = {
    collection: CollectionWithCount;
    onEdit: () => void;
    onDelete: () => void;
};

// List-view counterpart to CollectionCard, used when CollectionsSection's
// view toggle is set to "list". Shows a single cover thumbnail (the first
// cover image) instead of the full 2x2 collage — there's no room for a
// collage at row height, same tradeoff RecipeListRow makes showing one
// image instead of RecipeCard's larger photo.
export function CollectionListRow({ collection, onEdit, onDelete }: CollectionListRowProps) {
    const { data: coverUrls } = useCollectionCoverUrls(collection.coverImagePaths);

    const thumbnailUrl = coverUrls?.[collection.coverImagePaths[0]];

    return (
        <div className='flex items-center gap-4 rounded-lg border border-border bg-surface p-3 transition-colors duration-150 hover:border-border-strong'>
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
                <h3 className='truncate text-h3 font-medium text-text-primary'>{collection.name}</h3>
                {collection.description && (
                    <p className='truncate text-caption text-text-secondary'>{collection.description}</p>
                )}
            </div>

            <span className='shrink-0 text-caption text-text-disabled'>
                {collection.recipeCount} {collection.recipeCount === 1 ? 'recipe' : 'recipes'}
            </span>

            <ActionMenu
                ariaLabel={`Actions for ${collection.name}`}
                items={[
                    { label: 'Edit', onSelect: onEdit },
                    { label: 'Delete', onSelect: onDelete, variant: 'danger' }
                ]}
            />
        </div>
    );
}
