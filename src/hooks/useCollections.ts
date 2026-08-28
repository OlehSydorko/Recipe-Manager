import {
    addRecipeToCollection,
    createCollection,
    deleteCollection,
    getCollection,
    getCollectionIdsForRecipe,
    getCollectionRecipeIds,
    getCollections,
    getPublicCollectionsByUser,
    getSignedUrls,
    removeRecipeFromCollection,
    updateCollection
} from '@/api/collections';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const COLLECTIONS_QUERY_KEY = ['collections'];

const collectionIdsForRecipeKey = (recipeId: string | null) => ['collections', 'for-recipe', recipeId];
const collectionDetailKey = (id: string | null) => ['collections', 'detail', id];

export function useCollections() {
    return useQuery({
        queryKey: COLLECTIONS_QUERY_KEY,
        queryFn: getCollections
    });
}

export function useCollection(id: string | null) {
    return useQuery({
        enabled: Boolean(id),
        queryFn: () => getCollection(id as string),
        queryKey: collectionDetailKey(id)
    });
}

export function usePublicCollectionsByUser(userId: string | null) {
    return useQuery({
        enabled: Boolean(userId),
        queryFn: () => getPublicCollectionsByUser(userId as string),
        queryKey: ['collections', 'public', userId]
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
            queryClient.invalidateQueries({ queryKey: collectionDetailKey(collection.id) });
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

export function useCollectionIdsForRecipe(recipeId: string | null) {
    return useQuery({
        enabled: Boolean(recipeId),
        queryFn: () => getCollectionIdsForRecipe(recipeId as string),
        queryKey: collectionIdsForRecipeKey(recipeId)
    });
}

type RecipeCollectionInput = {
    collectionId: string;
    recipeId: string;
};

export function useAddRecipeToCollection() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ collectionId, recipeId }: RecipeCollectionInput) => addRecipeToCollection(collectionId, recipeId),
        onSuccess: (_data, { recipeId }) => {
            queryClient.invalidateQueries({ queryKey: collectionIdsForRecipeKey(recipeId) });
            queryClient.invalidateQueries({ queryKey: COLLECTIONS_QUERY_KEY });
        }
    });
}

export function useRemoveRecipeFromCollection() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ collectionId, recipeId }: RecipeCollectionInput) =>
            removeRecipeFromCollection(collectionId, recipeId),
        onSuccess: (_data, { recipeId }) => {
            queryClient.invalidateQueries({ queryKey: collectionIdsForRecipeKey(recipeId) });
            queryClient.invalidateQueries({ queryKey: COLLECTIONS_QUERY_KEY });
        }
    });
}
