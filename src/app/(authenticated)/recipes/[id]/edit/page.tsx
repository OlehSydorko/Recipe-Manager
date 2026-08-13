'use client';

import { use, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { CategorySelect } from '@/features/recipes/components/CategorySelect';
import { IngredientRows, createEmptyIngredientDraft } from '@/features/recipes/components/IngredientRows';
import { RecipeImagePicker } from '@/features/recipes/components/RecipeImagePicker';
import { LeaveButton } from '@/features/social/components/LeaveButton';
import { useIngredients, useReplaceIngredients } from '@/hooks/useIngredients';
import {
    useRecipe,
    useRecipeImageUrl,
    useRemoveRecipeImage,
    useUpdateRecipe,
    useUploadRecipeImage
} from '@/hooks/useRecipes';
import { isFormDirty } from '@/lib/formDirty';
import { DEFAULT_UNIT, type IngredientDraft, isAllowedUnit } from '@/types/ingredient';
import { useRouter } from 'next/navigation';

type EditRecipePageProps = {
    params: Promise<{ id: string }>;
};

export default function EditRecipePage({ params }: EditRecipePageProps) {
    const { id } = use(params);
    const router = useRouter();
    const { data: recipe, isPending: recipePending } = useRecipe(id);
    const { data: existingIngredients, isPending: ingredientsPending } = useIngredients(id);
    const { data: existingImageUrl } = useRecipeImageUrl(recipe?.image_url);
    const updateRecipe = useUpdateRecipe();
    const replaceIngredients = useReplaceIngredients();
    const uploadImage = useUploadRecipeImage();
    const removeImage = useRemoveRecipeImage();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [instructions, setInstructions] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [portions, setPortions] = useState<number | ''>(1);
    const [portionsError, setPortionsError] = useState('');
    const [ingredients, setIngredients] = useState<IngredientDraft[]>([createEmptyIngredientDraft()]);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageRemoved, setImageRemoved] = useState(false);

    // Snapshots of the loaded data, used only to detect unsaved changes for the Leave button.
    // `null` until the fetch resolves, so isFormDirty treats "still loading" as "not dirty".
    const [initialForm, setInitialForm] = useState<{
        title: string;
        description: string;
        instructions: string;
        categoryId: string;
        portions: number;
    } | null>(null);
    const [initialIngredients, setInitialIngredients] = useState<IngredientDraft[] | null>(null);

    useEffect(() => {
        if (recipe) {
            const loadedForm = {
                title: recipe.title,
                description: recipe.description ?? '',
                instructions: recipe.instructions ?? '',
                categoryId: recipe.category_id,
                portions: recipe.portions
            };

            setTitle(loadedForm.title);
            setDescription(loadedForm.description);
            setInstructions(loadedForm.instructions);
            setCategoryId(loadedForm.categoryId);
            setPortions(loadedForm.portions);
            setInitialForm(loadedForm);
        }
    }, [recipe]);

    useEffect(() => {
        if (existingIngredients && existingIngredients.length > 0) {
            const loadedIngredients = existingIngredients.map((ingredient) => ({
                key: ingredient.id,
                name: ingredient.name,
                quantity: ingredient.quantity ?? '',
                unit: ingredient.unit && isAllowedUnit(ingredient.unit) ? ingredient.unit : DEFAULT_UNIT
            }));

            setIngredients(loadedIngredients);
            setInitialIngredients(loadedIngredients);
        }
    }, [existingIngredients]);

    const isDirty =
        isFormDirty(initialForm, { title, description, instructions, categoryId, portions }) ||
        isFormDirty(initialIngredients, ingredients) ||
        Boolean(imageFile) ||
        imageRemoved;

    const isSubmitting =
        updateRecipe.isPending || replaceIngredients.isPending || uploadImage.isPending || removeImage.isPending;

    const handleImageFileChange = (nextFile: File | null) => {
        setImageFile(nextFile);
        setImageRemoved(false);
    };

    const handleImageRemove = () => {
        setImageFile(null);
        setImageRemoved(true);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!portions) {
            setPortionsError('Oops, you cannot have 0 portions.');
        }

        if (!title.trim() || !categoryId || !portions) {
            return;
        }

        await updateRecipe.mutateAsync({ id, title: title.trim(), description, instructions, categoryId, portions });

        await replaceIngredients.mutateAsync({ ingredients, recipeId: id });

        if (imageFile) {
            await uploadImage.mutateAsync({ recipeId: id, file: imageFile, previousPath: recipe?.image_url });
        } else if (imageRemoved && recipe?.image_url) {
            await removeImage.mutateAsync({ recipeId: id, path: recipe.image_url });
        }

        router.push(`/recipes/${id}`);
    };

    const handlePortionsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const raw = event.target.value;

        if (raw === '') {
            setPortions('');
            setPortionsError('');

            return;
        }

        const parsed = Number.parseInt(raw, 10);

        if (Number.isNaN(parsed)) {
            return;
        }

        setPortions(parsed);
        setPortionsError(parsed === 0 ? 'Oops, you cannot have 0 portions.' : '');
    };

    if (recipePending || ingredientsPending) {
        return <p className='text-body text-text-secondary'>Loading…</p>;
    }

    return (
        <div>
            <h1 className='text-display font-semibold text-text-primary'>Edit recipe</h1>

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
                        <label htmlFor='portions' className='mb-1.5 block text-label font-medium text-text-secondary'>
                            Portions
                        </label>
                        <Input
                            id='portions'
                            type='number'
                            min={0}
                            value={portions}
                            onChange={handlePortionsChange}
                            className='w-24'
                            required
                        />
                        {portionsError && <p className='mt-1.5 text-body text-error'>{portionsError}</p>}
                    </div>

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
                        existingImageUrl={existingImageUrl ?? null}
                        file={imageFile}
                        onFileChange={handleImageFileChange}
                        removed={imageRemoved}
                        onRemove={handleImageRemove}
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
                    {isSubmitting ? 'Saving…' : 'Save changes'}
                </Button>
            </form>

            <LeaveButton isDirty={isDirty} disabled={isSubmitting} />
        </div>
    );
}
