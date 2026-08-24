import { type StepInput, getSteps, replaceSteps } from '@/api/steps';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useSteps(recipeId: string) {
    return useQuery({
        enabled: Boolean(recipeId),
        queryFn: () => getSteps(recipeId),
        queryKey: ['recipes', recipeId, 'steps']
    });
}

type ReplaceStepsInput = {
    recipeId: string;
    steps: StepInput[];
};

export function useReplaceSteps() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ recipeId, steps }: ReplaceStepsInput) => replaceSteps(recipeId, steps),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['recipes', variables.recipeId, 'steps'] });
        }
    });
}
