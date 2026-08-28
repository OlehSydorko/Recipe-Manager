import type { ExtractedRecipe } from '@/lib/recipeImport/schema';
import { useMutation } from '@tanstack/react-query';

const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';

type ImportResponse = { ok: true; data: ExtractedRecipe } | { ok: false; error: string };

async function postImport(formData: FormData): Promise<ExtractedRecipe> {
    const response = await fetch('/api/recipes/import', { method: 'POST', body: formData });

    let payload: ImportResponse;

    try {
        payload = (await response.json()) as ImportResponse;
    } catch {
        throw new Error(GENERIC_ERROR_MESSAGE);
    }

    if (!payload.ok) {
        throw new Error(payload.error || GENERIC_ERROR_MESSAGE);
    }

    return payload.data;
}

export function useImportRecipeFromImage() {
    return useMutation({
        mutationFn: (files: File[]) => {
            const formData = new FormData();

            files.forEach((file) => formData.append('images', file));

            return postImport(formData);
        }
    });
}
