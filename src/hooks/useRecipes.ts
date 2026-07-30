import {
    createRecipe,
    deleteRecipe,
    getRecipe,
    getRecipeImageSignedUrl,
    getRecipes,
    removeRecipeImage,
    updateRecipe,
    uploadRecipeImage
} from '@/API/recipes';
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
