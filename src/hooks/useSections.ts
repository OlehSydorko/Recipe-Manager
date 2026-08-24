import { getSections, replaceSections } from '@/api/sections';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useSections(recipeId: string) {
    return useQuery({
        enabled: Boolean(recipeId),
        queryFn: () => getSections(recipeId),
        queryKey: ['recipes', recipeId, 'sections']
    });
}

type ReplaceSectionsInput = {
    recipeId: string;
    names: string[];
};

export function useReplaceSections() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ recipeId, names }: ReplaceSectionsInput) => replaceSections(recipeId, names),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['recipes', variables.recipeId, 'sections'] });
        }
    });
}
