import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createRecipe, deleteRecipe, getRecipe, getRecipes, updateRecipe } from '@/api/recipes';

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

export function useDeleteRecipe() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteRecipe,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: RECIPES_QUERY_KEY, exact: true });
        }
    });
}
