'use client';

import { use, useEffect, useState } from 'react';
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
import { useIngredients, useReplaceIngredients } from '@/hooks/useIngredients';
import {
    useRecipe,
    useRecipeImageUrl,
    useRemoveRecipeImage,
    useUpdateRecipe,
    useUploadRecipeImage
} from '@/hooks/useRecipes';
import { useReplaceSections, useSections } from '@/hooks/useSections';
import { useReplaceSteps, useSteps } from '@/hooks/useSteps';
import { isFormDirty } from '@/lib/formDirty';
import { DEFAULT_UNIT, type IngredientDraft, isAllowedUnit } from '@/types/ingredient';
import type { SectionDraft } from '@/types/section';
import type { StepDraft } from '@/types/step';
import { useRouter } from 'next/navigation';

type EditRecipePageProps = {
    params: Promise<{ id: string }>;
};

export default function EditRecipePage({ params }: EditRecipePageProps) {
    const { id } = use(params);
    const router = useRouter();
    const { data: recipe, isPending: recipePending } = useRecipe(id);
    const { data: existingSections, isPending: sectionsPending } = useSections(id);
    const { data: existingIngredients, isPending: ingredientsPending } = useIngredients(id);
    const { data: existingSteps, isPending: stepsPending } = useSteps(id);
    const { data: existingImageUrl } = useRecipeImageUrl(recipe?.image_url);
    const updateRecipe = useUpdateRecipe();
    const replaceSections = useReplaceSections();
    const replaceIngredients = useReplaceIngredients();
    const replaceSteps = useReplaceSteps();
    const uploadImage = useUploadRecipeImage();
    const removeImage = useRemoveRecipeImage();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [portions, setPortions] = useState<number | ''>(1);
    const [portionsError, setPortionsError] = useState('');
    const [sections, setSections] = useState<SectionDraft[]>([]);
    const [ingredients, setIngredients] = useState<IngredientDraft[]>([createEmptyIngredientDraft()]);
    const [steps, setSteps] = useState<StepDraft[]>([createEmptyStepDraft()]);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageRemoved, setImageRemoved] = useState(false);

    // Snapshots of the loaded data, used only to detect unsaved changes for the Leave button.
    // `null` until the fetch resolves, so isFormDirty treats "still loading" as "not dirty".
    const [initialForm, setInitialForm] = useState<{
        title: string;
        description: string;
        categoryId: string;
        portions: number;
    } | null>(null);
    const [initialSections, setInitialSections] = useState<SectionDraft[] | null>(null);
    const [initialIngredients, setInitialIngredients] = useState<IngredientDraft[] | null>(null);
    const [initialSteps, setInitialSteps] = useState<StepDraft[] | null>(null);

    useEffect(() => {
        if (recipe) {
            const loadedForm = {
                title: recipe.title,
                description: recipe.description ?? '',
                categoryId: recipe.category_id,
                portions: recipe.portions
            };

            setTitle(loadedForm.title);
            setDescription(loadedForm.description);
            setCategoryId(loadedForm.categoryId);
            setPortions(loadedForm.portions);
            setInitialForm(loadedForm);
        }
    }, [recipe]);

    // Uses each existing section's own id as its local draft key -- ingredient/step
    // drafts loaded below reference a section by that same real id via `sectionKey`,
    // and that's fine even though every save regenerates fresh section ids: it's the
    // same wholesale-replace pattern ingredients already use (see api/sections.ts).
    useEffect(() => {
        if (existingSections) {
            const loadedSections = existingSections.map((section) => ({ key: section.id, name: section.name }));

            setSections(loadedSections);
            setInitialSections(loadedSections);
        }
    }, [existingSections]);

    useEffect(() => {
        if (existingIngredients && existingIngredients.length > 0) {
            const loadedIngredients = existingIngredients.map((ingredient) => ({
                key: ingredient.id,
                name: ingredient.name,
                quantity: ingredient.quantity ?? '',
                sectionKey: ingredient.section_id,
                unit: ingredient.unit && isAllowedUnit(ingredient.unit) ? ingredient.unit : DEFAULT_UNIT
            }));

            setIngredients(loadedIngredients);
            setInitialIngredients(loadedIngredients);
        }
    }, [existingIngredients]);

    useEffect(() => {
        if (existingSteps && existingSteps.length > 0) {
            const loadedSteps = existingSteps.map((step) => ({
                instruction: step.instruction,
                key: step.id,
                sectionKey: step.section_id
            }));

            setSteps(loadedSteps);
            setInitialSteps(loadedSteps);
        }
    }, [existingSteps]);

    const isDirty =
        isFormDirty(initialForm, { title, description, categoryId, portions }) ||
        isFormDirty(initialSections, sections) ||
        isFormDirty(initialIngredients, ingredients) ||
        isFormDirty(initialSteps, steps) ||
        Boolean(imageFile) ||
        imageRemoved;

    const isSubmitting =
        updateRecipe.isPending ||
        replaceSections.isPending ||
        replaceIngredients.isPending ||
        replaceSteps.isPending ||
        uploadImage.isPending ||
        removeImage.isPending;

    const handleImageFileChange = (nextFile: File | null) => {
        setImageFile(nextFile);
        setImageRemoved(false);
    };

    const handleImageRemove = () => {
        setImageFile(null);
        setImageRemoved(true);
    };

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

        await updateRecipe.mutateAsync({ id, title: title.trim(), description, categoryId, portions });

        // Sections are saved before ingredients/steps so their (freshly regenerated,
        // see api/sections.ts) real ids exist to attach to.
        const namedSections = namedSectionDrafts(sections);
        const savedSections = await replaceSections.mutateAsync({
            names: namedSections.map((section) => section.name.trim()),
            recipeId: id
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
            recipeId: id
        });

        await replaceSteps.mutateAsync({
            recipeId: id,
            steps: steps.map((step) => ({
                instruction: step.instruction,
                sectionId: resolveSectionId(step.sectionKey)
            }))
        });

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

    if (recipePending || sectionsPending || ingredientsPending || stepsPending) {
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
                    {isSubmitting ? 'Saving…' : 'Save changes'}
                </Button>
            </form>

            <LeaveButton isDirty={isDirty} disabled={isSubmitting} />
        </div>
    );
}
