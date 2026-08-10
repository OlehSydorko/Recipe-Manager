import {
    createCollection,
    deleteCollection,
    getCollectionRecipeIds,
    getCollections,
    getSignedUrls,
    updateCollection
} from '@/API/collections';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const COLLECTIONS_QUERY_KEY = ['collections'];

export function useCollections() {
    return useQuery({
        queryKey: COLLECTIONS_QUERY_KEY,
        queryFn: getCollections
    });
}

export function useCollectionRecipeIds(collectionId: string | null) {
    return useQuery({
        enabled: Boolean(collectionId),
        queryFn: () => getCollectionRecipeIds(collectionId as string),
        queryKey: ['collections', collectionId, 'recipe-ids']
    });
}

export function useCreateCollection() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createCollection,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: COLLECTIONS_QUERY_KEY });
        }
    });
}

export function useUpdateCollection() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateCollection,
        onSuccess: (collection) => {
            queryClient.invalidateQueries({ queryKey: COLLECTIONS_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: ['collections', collection.id, 'recipe-ids'] });
        }
    });
}

export function useDeleteCollection() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteCollection(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: COLLECTIONS_QUERY_KEY });
        }
    });
}


export function useCollectionCoverUrls(paths: string[]) {
    return useQuery({
        enabled: paths.length > 0,
        queryFn: () => getSignedUrls(paths),
        queryKey: ['collection-cover-urls', paths]
    });
}
