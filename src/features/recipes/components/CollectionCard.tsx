'use client';

import { ActionMenu } from '@/components/ui/ActionMenu';
import type { CollectionWithCount } from '@/types/collection';
import { Folder } from 'lucide-react';

type CollectionCardProps = {
    collection: CollectionWithCount;
    onEdit: () => void;
    onDelete: () => void;
};

export function CollectionCard({ collection, onEdit, onDelete }: CollectionCardProps) {
    return (
        <div className='relative rounded-lg border border-border bg-surface p-4'>
            <div className='absolute right-2 top-2'>
                <ActionMenu
                    ariaLabel={`Actions for ${collection.name}`}
                    items={[
                        { label: 'Edit', onSelect: onEdit },
                        { label: 'Delete', onSelect: onDelete, variant: 'danger' }
                    ]}
                />
            </div>

            <Folder size={20} className='text-accent' />

            <h3 className='mt-3 truncate pr-8 text-h3 font-medium text-text-primary'>{collection.name}</h3>

            {collection.description && (
                <p className='mt-1 line-clamp-2 text-caption text-text-secondary'>{collection.description}</p>
            )}

            <p className='mt-3 text-caption text-text-disabled'>
                {collection.recipeCount} {collection.recipeCount === 1 ? 'recipe' : 'recipes'}
            </p>
        </div>
    );
}
