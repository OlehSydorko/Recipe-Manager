'use client'
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useCollections, useDeleteCollection } from '@/hooks/useCollections';
import { useRecipes } from '@/hooks/useRecipes'
import { Folder, Plus, Search } from 'lucide-react';
import { CollectionWithCount } from '@/types/collection';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { CollectionCard } from './CollectionCard';
import { CollectionModal } from './CollectionModal';

import { CollectionGridControls, type CollectionSortOption, type CollectionViewMode } from './CollectionGridControls';
import { CollectionListRow } from './CollectionListRow';


type CollectionsSectionProps = {
    variant?: 'page' | 'tab';
};

export function CollectionsSection ({ variant = 'page' }: CollectionsSectionProps) {
    const isTabVariant = variant === 'tab';
    const { data: recipes } = useRecipes();
    const { data: collections, isPending: collectionsPending } = useCollections();
    const deleteCollection = useDeleteCollection();
    const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
    const [editingCollection, setEditingCollection] = useState<CollectionWithCount | null>(null)
    const [deletingCollection, setDeletingCollection] = useState<CollectionWithCount | null>(null)
    const [searchQuery, setSearchQuery] = useState('');


    const filteredCollections = collections?.filter(
        (collection) => !searchQuery.trim() || collection.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
     const isFiltered = Boolean(searchQuery.trim());

    const [sortBy, setSortBy] = useState<CollectionSortOption>('newest');
    const [viewMode, setViewMode] = useState<CollectionViewMode>('grid')


    const sortedCollections = useMemo(() => {
        const source = filteredCollections ?? [];
        
        return [...source].sort((a, b) => {
            if (sortBy === 'oldest') {
                return a.created_at.localeCompare(b.created_at);
            }
            if (sortBy === 'title') {
                return a.name.localeCompare(b.name);
            }
            
return b.created_at.localeCompare(a.created_at);
        });
    }, [filteredCollections, sortBy]);


    const handleNewCollection = () => {
        setEditingCollection(null)
        setIsCollectionModalOpen(true);
    }
    const handleEditCollection = (collection: CollectionWithCount) => {
        setEditingCollection(collection)
        setIsCollectionModalOpen(true);
    }

    const handleDeleteCollection = () => {
        if(!deletingCollection) {
            return
        }
        deleteCollection.mutate(deletingCollection.id, {
            onSuccess: () => setDeletingCollection(null)
        });
    };

    return <div>
                    {!isTabVariant && (
                        <div className='flex flex-wrap items-center justify-between gap-4'>
                            <h1 className='text-display font-semibold text-text-primary'>Collections</h1>

                            <Button variant='primary' onClick={handleNewCollection}>
                                <Plus size={16} />
                                New collection
                            </Button>
                        </div>
                    )}

                    {!isTabVariant && (
                     <div className='relative mt-5'>
                       <Search
                          size={17}
                           className='pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-disabled'
                       />
                       <Input
                           type='search'
                           placeholder='Search collections'
                           aria-label='Search collections'
                           value={searchQuery}
                           onChange={(event) => setSearchQuery(event.target.value)}
                           className='h-10 w-full rounded-full border border-border bg-bg-secondary pl-10 pr-4 text-body text-text-primary transition-colors duration-150 placeholder:text-text-disabled focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15'
                       />


                       </div>
                    )}

                        <div className='mt-5 flex justify-end'>
                            <CollectionGridControls 
                                sortBy={sortBy}
                                onSortChange={setSortBy}
                                viewMode= {viewMode}
                                onViewModeChange={setViewMode}
                             />

                        </div>


                    {collectionsPending && <p className='mt-6 text-body text-text-secondary'>Loading…</p>}

                    {!collectionsPending && sortedCollections?.length === 0 && (
                        <div className='mt-16 flex flex-col items-center gap-3 text-center'>
                            <Folder size={32} className='text-text-disabled' />
                             <p className='text-h3 font-medium text-text-primary'>
                              {isFiltered ? 'No collections match this search' : 'No collections yet'}
                           </p>
                           <p className='text-body text-text-secondary'>
                               {isFiltered
                                   ? 'Try a different search.'
                                 : 'Group recipes together, like "weeknight dinners" or "meal prep".'}
                           </p>
                        </div>
                    )}

                    {!collectionsPending && sortedCollections && sortedCollections.length > 0 && viewMode === 'grid' && (
                        <div className='mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                            {sortedCollections.map((collection) => (
                                <CollectionCard
                                    key={collection.id}
                                    collection={collection}
                                    onEdit={() => handleEditCollection(collection)}
                                    onDelete={() => setDeletingCollection(collection)}
                                    hideActions={isTabVariant}
                                />
                            ))}
                        </div>
                    )}


                    {!collectionsPending && sortedCollections.length > 0 && viewMode === 'list' && (
                       <div className='mt-6 space-y-3'>
                            {sortedCollections.map((collection) => (
                            <CollectionListRow
                                key={collection.id}
                                collection={collection}
                                onEdit={() => handleEditCollection(collection)}
                                onDelete={() => setDeletingCollection(collection)}
                                hideActions={isTabVariant}
                            />
                            ))}
                       </div>
                    )}


            <CollectionModal
                open={isCollectionModalOpen}
                onClose={() => setIsCollectionModalOpen(false)}
                collection={editingCollection}
                recipes={recipes ?? []}
            />


            <Modal
                open={Boolean(deletingCollection)}
                onClose={() => setDeletingCollection(null)}
                title='Delete collection?'
                footer={
                    <>
                        <Button variant='secondary' onClick={() => setDeletingCollection(null)}>
                            Cancel
                        </Button>
                        <Button variant='danger' onClick={handleDeleteCollection} disabled={deleteCollection.isPending}>
                            {deleteCollection.isPending ? 'Deleting…' : 'Delete'}
                        </Button>
                    </>
                }
            >
                {deletingCollection && `Delete "${deletingCollection.name}"? This can't be undone.`}
            </Modal>

            </div>
            
}
