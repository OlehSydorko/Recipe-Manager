'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { CategorySelect } from '@/features/recipes/components/CategorySelect';
import { IngredientRows, createEmptyIngredientDraft } from '@/features/recipes/components/IngredientRows';
import { RecipeImagePicker } from '@/features/recipes/components/RecipeImagePicker';
import { SectionsManager } from '@/features/recipes/components/SectionsManager';
import { StepRows, createEmptyStepDraft } from '@/features/recipes/components/StepRows';
import {
    createEmptySectionDraft,
    namedSectionDrafts,
    removeSection,
    renameSection,
    resolveSectionIds,
    unassignSection
} from '@/features/recipes/sectionedDrafts';
import { LeaveButton } from '@/features/social/components/LeaveButton';
import { useReplaceIngredients } from '@/hooks/useIngredients';
import { useCreateRecipe, useUploadRecipeImage } from '@/hooks/useRecipes';
import { useReplaceSections } from '@/hooks/useSections';
import { useReplaceSteps } from '@/hooks/useSteps';
import { isFormDirty } from '@/lib/formDirty';
import type { IngredientDraft } from '@/types/ingredient';
import type { SectionDraft } from '@/types/section';
import type { StepDraft } from '@/types/step';
import { useRouter } from 'next/navigation';

const INITIAL_FORM = { title: '', description: '', categoryId: '', portions: 1 };

export default function NewRecipePage() {
    const router = useRouter();
    const createRecipe = useCreateRecipe();
    const replaceSections = useReplaceSections();
    const replaceIngredients = useReplaceIngredients();
    const replaceSteps = useReplaceSteps();
    const uploadImage = useUploadRecipeImage();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [portions, setPortions] = useState<number | ''>(1);
    const [portionsError, setPortionsError] = useState('');
    const [sections, setSections] = useState<SectionDraft[]>([]);
    const [ingredients, setIngredients] = useState<IngredientDraft[]>([createEmptyIngredientDraft()]);
    const [steps, setSteps] = useState<StepDraft[]>([createEmptyStepDraft()]);
    const [imageFile, setImageFile] = useState<File | null>(null);

    // Captures the blank starting rows once on mount, so edits/added/removed rows can be detected.
    const initialIngredientsRef = useRef(ingredients);
    const initialStepsRef = useRef(steps);

    const isDirty =
        isFormDirty(INITIAL_FORM, { title, description, categoryId, portions }) ||
        isFormDirty<SectionDraft[]>([], sections) ||
        isFormDirty(initialIngredientsRef.current, ingredients) ||
        isFormDirty(initialStepsRef.current, steps) ||
        Boolean(imageFile);

    const isSubmitting =
        createRecipe.isPending ||
        replaceSections.isPending ||
        replaceIngredients.isPending ||
        replaceSteps.isPending ||
        uploadImage.isPending;

    const handleAddSection = () => setSections((previous) => [...previous, createEmptySectionDraft()]);

    const handleRenameSection = (key: string, name: string) =>
        setSections((previous) => renameSection(previous, key, name));

    const handleRemoveSection = (key: string) => {
        setSections((previous) => removeSection(previous, key));
        setIngredients((previous) => unassignSection(previous, key));
        setSteps((previous) => unassignSection(previous, key));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!portions) {
            setPortionsError('Oops, you cannot have 0 portions.');
        }

        if (!title.trim() || !categoryId || !portions) {
            return;
        }

        const recipe = await createRecipe.mutateAsync({
            title: title.trim(),
            description,
            categoryId,
            portions
        });

        // Sections are saved before ingredients/steps so their real ids exist to
        // attach to -- see sectionedDrafts.ts for how the local draft keys below get
        // resolved to those real ids.
        const namedSections = namedSectionDrafts(sections);
        const savedSections = await replaceSections.mutateAsync({
            names: namedSections.map((section) => section.name.trim()),
            recipeId: recipe.id
        });
        const sectionIdByKey = resolveSectionIds(namedSections, savedSections);
        const resolveSectionId = (key: string | null) => (key ? (sectionIdByKey.get(key) ?? null) : null);

        await replaceIngredients.mutateAsync({
            ingredients: ingredients.map((ingredient) => ({
                name: ingredient.name,
                quantity: ingredient.quantity,
                sectionId: resolveSectionId(ingredient.sectionKey),
                unit: ingredient.unit
            })),
            recipeId: recipe.id
        });

        await replaceSteps.mutateAsync({
            recipeId: recipe.id,
            steps: steps.map((step) => ({
                instruction: step.instruction,
                sectionId: resolveSectionId(step.sectionKey)
            }))
        });

        // The image can only be uploaded once the recipe (and its id) exists,
        // same reason ingredients/sections/steps are saved as follow-up steps above.
        if (imageFile) {
            await uploadImage.mutateAsync({ recipeId: recipe.id, file: imageFile });
        }

        router.push(`/recipes/${recipe.id}`);
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
                        existingImageUrl={null}
                        file={imageFile}
                        onFileChange={setImageFile}
                        removed={false}
                        onRemove={() => setImageFile(null)}
                        disabled={isSubmitting}
                    />
                </div>

                <div className='rounded-lg border border-border bg-surface p-5'>
                    <SectionsManager
                        sections={sections}
                        onAdd={handleAddSection}
                        onRename={handleRenameSection}
                        onRemove={handleRemoveSection}
                    />
                </div>

                <div className='rounded-lg border border-border bg-surface p-5'>
                    <IngredientRows ingredients={ingredients} sections={sections} onChange={setIngredients} />
                </div>

                <div className='rounded-lg border border-border bg-surface p-5'>
                    <StepRows steps={steps} sections={sections} onChange={setSteps} />
                </div>

                <Button type='submit' variant='primary' disabled={isSubmitting} fullWidth>
                    {isSubmitting ? 'Creating…' : 'Create recipe'}
                </Button>
            </form>

            <LeaveButton isDirty={isDirty} disabled={isSubmitting} />
        </div>
    );
}
