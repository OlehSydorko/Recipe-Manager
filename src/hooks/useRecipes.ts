import {
    createRecipe,
    deleteRecipe,
    getRecipe,
    getRecipeImageSignedUrl,
    getRecipes,
    removeRecipeImage,
    setRecipeFavorite,
    updateRecipe,
    uploadRecipeImage
} from '@/API/recipes';
import type { Recipe } from '@/types/recipe';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const RECIPES_QUERY_KEY = ['recipes'];

export function useRecipes() {
    return useQuery({
        queryKey: RECIPES_QUERY_KEY,
        queryFn: getRecipes
    });
}

export function useRecipe(id: string) {
    return useQuery({
        queryKey: ['recipes', id],
        queryFn: () => getRecipe(id)
    });
}

// Resolves a recipe's stored image path to a viewable (time-limited) signed URL.
// `path` is null/undefined while a recipe has no image, or while it's still loading.
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

// The only optimistic mutation in this file: the star toggle is a high-frequency,
// low-risk click where instant feedback matters, unlike every other mutation here,
// which waits for the request to settle before invalidating.
export function useSetRecipeFavorite() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, isFavorite }: SetRecipeFavoriteInput) => setRecipeFavorite(id, isFavorite),
        onMutate: async ({ id, isFavorite }: SetRecipeFavoriteInput) => {
            await queryClient.cancelQueries({ queryKey: RECIPES_QUERY_KEY });
            await queryClient.cancelQueries({ queryKey: ['recipes', id] });

            const previousRecipes = queryClient.getQueryData<Recipe[]>(RECIPES_QUERY_KEY);
            const previousRecipe = queryClient.getQueryData<Recipe>(['recipes', id]);

            queryClient.setQueryData<Recipe[]>(RECIPES_QUERY_KEY, (recipes) =>
                recipes?.map((recipe) => (recipe.id === id ? { ...recipe, is_favorite: isFavorite } : recipe))
            );
            queryClient.setQueryData<Recipe>(['recipes', id], (recipe) =>
                recipe ? { ...recipe, is_favorite: isFavorite } : recipe
            );

            return { previousRecipe, previousRecipes };
        },
        onError: (_error, { id }: SetRecipeFavoriteInput, context) => {
            if (context?.previousRecipes) {
                queryClient.setQueryData(RECIPES_QUERY_KEY, context.previousRecipes);
            }

            if (context?.previousRecipe) {
                queryClient.setQueryData(['recipes', id], context.previousRecipe);
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
