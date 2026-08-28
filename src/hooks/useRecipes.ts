import { addFavorite, removeFavorite } from '@/api/favorites';
import {
    createRecipe,
    deleteRecipe,
    getCommunityRecipes,
    getRecipe,
    getRecipeImageSignedUrl,
    getRecipes,
    getRecipesByIds,
    getRecipesByUser,
    removeRecipeImage,
    updateRecipe,
    uploadRecipeImage
} from '@/api/recipes';
import type { Recipe, RecipeWithAuthor } from '@/types/recipe';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const RECIPES_QUERY_KEY = ['recipes'];
const COMMUNITY_RECIPES_QUERY_KEY = ['recipes', 'community'];

export function useRecipes() {
    return useQuery({
        queryKey: RECIPES_QUERY_KEY,
        queryFn: getRecipes
    });
}

export function useCommunityRecipes() {
    return useQuery({
        queryKey: COMMUNITY_RECIPES_QUERY_KEY,
        queryFn: getCommunityRecipes
    });
}

export function useRecipesByUser(userId: string) {
    return useQuery({
        enabled: Boolean(userId),
        queryKey: [...RECIPES_QUERY_KEY, 'by-user', userId],
        queryFn: () => getRecipesByUser(userId)
    });
}

export function useRecipesByIds(ids: string[]) {
    return useQuery({
        enabled: ids.length > 0,
        queryKey: [...RECIPES_QUERY_KEY, 'by-ids', ...[...ids].sort()],
        queryFn: () => getRecipesByIds(ids)
    });
}

export function useRecipe(id: string) {
    return useQuery({
        queryKey: ['recipes', id],
        queryFn: () => getRecipe(id)
    });
}

export function useRecipeImageUrl(path: string | null | undefined) {
    return useQuery({
        enabled: Boolean(path),
        queryFn: () => getRecipeImageSignedUrl(path as string),
        queryKey: ['recipe-image-url', path]
    });
}

export function useCreateRecipe() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createRecipe,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: RECIPES_QUERY_KEY });
        }
    });
}

export function useUpdateRecipe() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateRecipe,
        onSuccess: (recipe) => {
            queryClient.invalidateQueries({ queryKey: RECIPES_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: ['recipes', recipe.id] });
        }
    });
}

type DeleteRecipeInput = {
    id: string;
    imagePath?: string | null;
};

export function useDeleteRecipe() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, imagePath }: DeleteRecipeInput) => deleteRecipe(id, imagePath),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: RECIPES_QUERY_KEY, exact: true });
            queryClient.invalidateQueries({ queryKey: COMMUNITY_RECIPES_QUERY_KEY });
        }
    });
}

type UploadRecipeImageInput = {
    recipeId: string;
    file: File;
    previousPath?: string | null;
};

export function useUploadRecipeImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ recipeId, file, previousPath }: UploadRecipeImageInput) =>
            uploadRecipeImage(recipeId, file, previousPath),
        onSuccess: (recipe) => {
            queryClient.invalidateQueries({ queryKey: RECIPES_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: ['recipes', recipe.id] });
        }
    });
}

type SetRecipeFavoriteInput = {
    id: string;
    isFavorite: boolean;
};

export function useSetRecipeFavorite() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, isFavorite }: SetRecipeFavoriteInput) => (isFavorite ? addFavorite(id) : removeFavorite(id)),
        onMutate: async ({ id, isFavorite }: SetRecipeFavoriteInput) => {
            await queryClient.cancelQueries({ queryKey: RECIPES_QUERY_KEY });
            await queryClient.cancelQueries({ queryKey: ['recipes', id] });

            const previousRecipes = queryClient.getQueryData<Recipe[]>(RECIPES_QUERY_KEY);
            const previousRecipe = queryClient.getQueryData<Recipe>(['recipes', id]);
            const previousCommunityRecipes = queryClient.getQueryData<RecipeWithAuthor[]>(COMMUNITY_RECIPES_QUERY_KEY);

            queryClient.setQueryData<Recipe[]>(RECIPES_QUERY_KEY, (recipes) =>
                recipes?.map((recipe) => (recipe.id === id ? { ...recipe, is_favorite: isFavorite } : recipe))
            );
            queryClient.setQueryData<Recipe>(['recipes', id], (recipe) =>
                recipe ? { ...recipe, is_favorite: isFavorite } : recipe
            );
            queryClient.setQueryData<RecipeWithAuthor[]>(COMMUNITY_RECIPES_QUERY_KEY, (recipes) =>
                recipes?.map((recipe) => (recipe.id === id ? { ...recipe, is_favorite: isFavorite } : recipe))
            );

            return { previousRecipe, previousRecipes, previousCommunityRecipes };
        },
        onError: (_error, { id }: SetRecipeFavoriteInput, context) => {
            if (context?.previousRecipes) {
                queryClient.setQueryData(RECIPES_QUERY_KEY, context.previousRecipes);
            }

            if (context?.previousRecipe) {
                queryClient.setQueryData(['recipes', id], context.previousRecipe);
            }

            if (context?.previousCommunityRecipes) {
                queryClient.setQueryData(COMMUNITY_RECIPES_QUERY_KEY, context.previousCommunityRecipes);
            }
        },
        onSettled: (_data, _error, { id }: SetRecipeFavoriteInput) => {
            queryClient.invalidateQueries({ queryKey: RECIPES_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: ['recipes', id] });
        }
    });
}

type RemoveRecipeImageInput = {
    recipeId: string;
    path: string;
};

export function useRemoveRecipeImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ recipeId, path }: RemoveRecipeImageInput) => removeRecipeImage(recipeId, path),
        onSuccess: (recipe) => {
            queryClient.invalidateQueries({ queryKey: RECIPES_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: ['recipes', recipe.id] });
        }
    });
}
