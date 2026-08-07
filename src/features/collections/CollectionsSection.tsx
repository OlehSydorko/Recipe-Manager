'use client'
import { Modal } from '@/components/ui/Modal';
import { useCollections, useDeleteCollection } from '@/hooks/useCollections';
import { useRecipes } from '@/hooks/useRecipes'
import { Folder, Plus } from 'lucide-react';
import { CollectionWithCount } from '@/types/collection';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { CollectionCard } from './CollectionCard';
import { CollectionModal } from './CollectionModal';


export function CollectionsSection () {
    const { data: recipes } = useRecipes();
    const { data: collections, isPending: collectionsPending } = useCollections();
    const deleteCollection = useDeleteCollection();
    const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
    const [editingCollection, setEditingCollection] = useState<CollectionWithCount | null>(null)
    const [deletingCollection, setDeletingCollection] = useState<CollectionWithCount | null>(null)


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
                    <div className='mt-5 flex justify-end'>
                        <Button variant='primary' onClick={handleNewCollection}>
                            <Plus size={16} />
                            New collection
                        </Button>
                    </div>

                    {collectionsPending && <p className='mt-6 text-body text-text-secondary'>Loading…</p>}

                    {!collectionsPending && collections?.length === 0 && (
                        <div className='mt-16 flex flex-col items-center gap-3 text-center'>
                            <Folder size={32} className='text-text-disabled' />
                            <p className='text-h3 font-medium text-text-primary'>No collections yet</p>
                            <p className='text-body text-text-secondary'>
                                Group recipes together, like &quot;weeknight dinners&quot; or &quot;meal prep&quot;.
                            </p>
                        </div>
                    )}

                    {!collectionsPending && collections && collections.length > 0 && (
                        <div className='mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                            {collections.map((collection) => (
                                <CollectionCard
                                    key={collection.id}
                                    collection={collection}
                                    onEdit={() => handleEditCollection(collection)}
                                    onDelete={() => setDeletingCollection(collection)}
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
