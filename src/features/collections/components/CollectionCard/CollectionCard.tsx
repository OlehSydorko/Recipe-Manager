'use client';

import { ActionMenu } from '@/components/ui/ActionMenu/ActionMenu';
import { useCollectionCoverUrls } from '@/hooks/useCollections';
import type { CollectionWithCount } from '@/types/collection';
import Link from 'next/link';
import { CollectionCoverMosaic } from '../CollectionCoverMosaic';
import styles from './CollectionCard.module.scss';

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
        <div className={`group ${styles.card}`}>
            {/* Link overlay covers the whole card so it stays clickable everywhere except
                the action menu below, which sits above it (z-20) in its own stacking layer. */}
            <Link href={`/collections/${collection.id}`} aria-label={collection.name} className='absolute inset-0 z-0' />

            <div className='pointer-events-none relative z-10'>
                <div className={styles.coverWrapper}>
                    <CollectionCoverMosaic imageUrls={cellUrls} />

                    <span className={styles.recipeCountBadge}>
                        {collection.recipeCount} {collection.recipeCount === 1 ? 'recipe' : 'recipes'}
                    </span>
                </div>

                <div className='p-3 sm:p-4'>
                    <div className='mt-3 flex items-center gap-2 pr-8'>
                        <h3 className={styles.title}>{collection.name}</h3>
                        {collection.is_public && <span className={styles.publicBadge}>Public</span>}
                    </div>
                    {collection.description && <p className={styles.description}>{collection.description}</p>}
                </div>
            </div>

            {!hideActions && (
                <div className={styles.actions}>
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
