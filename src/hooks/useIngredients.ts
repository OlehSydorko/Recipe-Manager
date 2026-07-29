import { getIngredients, replaceIngredients, type IngredientInput } from '@/API/ingredients';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useIngredients(recipeId: string) {
    return useQuery({
        enabled: Boolean(recipeId),
        queryFn: () => getIngredients(recipeId),
        queryKey: ['recipes', recipeId, 'ingredients']
    });
}

type ReplaceIngredientsInput = {
    recipeId: string;
    ingredients: IngredientInput[];
};

export function useReplaceIngredients() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ recipeId, ingredients }: ReplaceIngredientsInput) => replaceIngredients(recipeId, ingredients),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['recipes', variables.recipeId, 'ingredients'] });
        }
    });
}
