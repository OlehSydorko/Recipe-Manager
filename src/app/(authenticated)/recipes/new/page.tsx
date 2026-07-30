'use client';

import { useRef, useState } from 'react';
import { CategorySelect } from '@/components/CategorySelect';
import { IngredientRows, createEmptyIngredientDraft } from '@/components/IngredientRows';
import { LeaveButton } from '@/components/LeaveButton';
import { RecipeImagePicker } from '@/components/RecipeImagePicker';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useReplaceIngredients } from '@/hooks/useIngredients';
import { useCreateRecipe, useUploadRecipeImage } from '@/hooks/useRecipes';
import { isFormDirty } from '@/lib/formDirty';
import type { IngredientDraft } from '@/types/ingredient';
import { useRouter } from 'next/navigation';

const INITIAL_FORM = { title: '', description: '', instructions: '', categoryId: '' };

export default function NewRecipePage() {
    const router = useRouter();
    const createRecipe = useCreateRecipe();
    const replaceIngredients = useReplaceIngredients();
    const uploadImage = useUploadRecipeImage();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [instructions, setInstructions] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [ingredients, setIngredients] = useState<IngredientDraft[]>([createEmptyIngredientDraft()]);
    const [imageFile, setImageFile] = useState<File | null>(null);

    // Captures the blank starting row once on mount, so edits/added/removed rows can be detected.
    const initialIngredientsRef = useRef(ingredients);

    const isDirty =
        isFormDirty(INITIAL_FORM, { title, description, instructions, categoryId }) ||
        isFormDirty(initialIngredientsRef.current, ingredients) ||
        Boolean(imageFile);

    const isSubmitting = createRecipe.isPending || replaceIngredients.isPending || uploadImage.isPending;

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!title.trim() || !categoryId) {
            return;
        }

        const recipe = await createRecipe.mutateAsync({
            title: title.trim(),
            description,
            instructions,
            categoryId
        });

        await replaceIngredients.mutateAsync({ ingredients, recipeId: recipe.id });

        // The image can only be uploaded once the recipe (and its id) exists,
        // same reason ingredients are saved as a second step above.
        if (imageFile) {
            await uploadImage.mutateAsync({ recipeId: recipe.id, file: imageFile });
        }

        router.push(`/recipes/${recipe.id}`);
    };

    return (
        <div>
            <h1 className='text-display font-semibold text-text-primary'>New recipe</h1>

            <form onSubmit={handleSubmit} className='mt-5 max-w-xl space-y-5'>
                <div className='space-y-4 rounded-lg border border-border bg-surface p-5'>
                    <div>
                        <label htmlFor='title' className='mb-1.5 block text-label font-medium text-text-secondary'>
                            Title
                        </label>
                        <Input
                            id='title'
                            type='text'
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            required
                        />
                    </div>

                    <CategorySelect value={categoryId} onChange={setCategoryId} />

                    <div>
                        <label
                            htmlFor='description'
                            className='mb-1.5 block text-label font-medium text-text-secondary'
                        >
                            Description <span className='font-normal text-text-disabled'>(optional)</span>
                        </label>
                        <Textarea
                            id='description'
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            rows={2}
                        />
                    </div>

                    <RecipeImagePicker
                        existingImageUrl={null}
                        file={imageFile}
                        onFileChange={setImageFile}
                        removed={false}
                        onRemove={() => setImageFile(null)}
                        disabled={isSubmitting}
                    />
                </div>

                <div className='rounded-lg border border-border bg-surface p-5'>
                    <IngredientRows ingredients={ingredients} onChange={setIngredients} />
                </div>

                <div className='rounded-lg border border-border bg-surface p-5'>
                    <label htmlFor='instructions' className='mb-1.5 block text-label font-medium text-text-secondary'>
                        Instructions
                    </label>
                    <Textarea
                        id='instructions'
                        value={instructions}
                        onChange={(event) => setInstructions(event.target.value)}
                        rows={5}
                    />
                </div>

                <Button type='submit' variant='primary' disabled={isSubmitting} fullWidth>
                    {isSubmitting ? 'Creating…' : 'Create recipe'}
                </Button>
            </form>

            <LeaveButton isDirty={isDirty} disabled={isSubmitting} />
        </div>
    );
}
