'use client';

import { useEffect, useState } from 'react';
import { ActionMenu } from '@/components/ui/ActionMenu';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TextLineSkeleton } from '@/components/ui/Skeleton';
import { FavoriteStar } from '@/features/recipes/components/FavoriteStar';
import { PortionsChanger } from '@/features/recipes/components/PortionsChanger';
import { SaveToCollectionButton } from '@/features/recipes/components/SaveToCollectionButton';
import { LeaveButton } from '@/features/social/components/LeaveButton';
import { useIngredients } from '@/hooks/useIngredients';
import { useCurrentProfile, useProfile } from '@/hooks/useProfile';
import { useDeleteRecipe, useRecipe, useRecipeImageUrl } from '@/hooks/useRecipes';
import { useSections } from '@/hooks/useSections';
import { useSteps } from '@/hooks/useSteps';
import { scaleQuantity } from '@/lib/quantity';
import { groupBySection } from '@/lib/sections';
import { Check, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type RecipeDetailClientProps = {
    id: string;
};

export function RecipeDetailClient({ id }: RecipeDetailClientProps) {
    const router = useRouter();
    const { data: recipe, isPending, isError } = useRecipe(id);
    const { data: ingredients, isPending: ingredientsPending } = useIngredients(id);
    const { data: steps, isPending: stepsPending } = useSteps(id);
    const { data: sections, isPending: sectionsPending } = useSections(id);
    const { data: imageUrl } = useRecipeImageUrl(recipe?.image_url);
    const { data: currentProfile } = useCurrentProfile();
    const isOwner = Boolean(recipe && currentProfile && recipe.user_id === currentProfile.id);
    const { data: author } = useProfile(recipe && !isOwner ? recipe.user_id : '');
    const deleteRecipe = useDeleteRecipe();

    const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    const [selectedPortions, setSelectedPortions] = useState(1);

    useEffect(() => {
        if (recipe) {
            setSelectedPortions(recipe.portions);
        }
    }, [recipe]);

    const scaleFactor = recipe ? selectedPortions / recipe.portions : 1;

    const isIngredientsLoading = ingredientsPending || sectionsPending;
    const isStepsLoading = stepsPending || sectionsPending;
    const ingredientGroups = groupBySection(sections ?? [], ingredients ?? []);
    const stepGroups = groupBySection(sections ?? [], steps ?? []);

    const handleDelete = () => {
        deleteRecipe.mutate(
            { id, imagePath: recipe?.image_url },
            {
                onSuccess: () => router.push('/recipes')
            }
        );
    };

    const handleToggleIngredient = (ingredientId: string) => {
        setCheckedIds((previous) => {
            const next = new Set(previous);

            if (next.has(ingredientId)) {
                next.delete(ingredientId);
            } else {
                next.add(ingredientId);
            }

            return next;
        });
    };

    if (isPending) {
        return (
            <div className='space-y-4'>
                <TextLineSkeleton className='h-56 w-full rounded-lg sm:h-72' />
                <TextLineSkeleton className='h-7 w-1/2' />
                <TextLineSkeleton className='h-4 w-1/3' />
            </div>
        );
    }

    if (isError || !recipe) {
        return <p className='text-body text-error'>Recipe not found.</p>;
    }

    return (
        <div>
            {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt={recipe.title} className='h-56 w-full rounded-lg object-cover sm:h-72' />
            ) : (
                <div className='flex h-56 w-full items-center justify-center rounded-lg bg-bg-secondary text-text-disabled sm:h-72'>
                    <ImageIcon size={36} />
                </div>
            )}

            <div className='mt-5 flex items-start justify-between gap-3'>
                <h1 className='text-display font-semibold text-text-primary'>{recipe.title}</h1>

                <div className='flex items-center gap-1'>
                    <FavoriteStar recipeId={recipe.id} isFavorite={recipe.is_favorite} />
                    <SaveToCollectionButton recipeId={recipe.id} />

                    {isOwner && (
                        <ActionMenu
                            ariaLabel={`Actions for ${recipe.title}`}
                            items={[
                                { label: 'Edit', onSelect: () => router.push(`/recipes/${recipe.id}/edit`) },
                                { label: 'Delete', variant: 'danger', onSelect: () => setIsDeleteConfirmOpen(true) }
                            ]}
                        />
                    )}
                </div>
            </div>

            {!isOwner && author && (
                <Link
                    href={`/profile/${author.id}`}
                    className='mt-1 inline-block text-label text-text-secondary hover:text-accent'
                >
                    by {author.display_name ?? 'Someone'}
                </Link>
            )}

            {recipe.description && <p className='mt-2 text-body text-text-secondary'>{recipe.description}</p>}

            <div className='mt-8 rounded-lg border border-border bg-surface p-5'>
                <div className='flex flex-wrap items-center justify-between gap-3'>
                    <h2 className='text-h2 font-semibold text-text-primary'>Ingredients</h2>
                    <PortionsChanger value={selectedPortions} onChange={setSelectedPortions} />
                </div>

                {isIngredientsLoading && (
                    <div className='mt-3 space-y-2'>
                        <TextLineSkeleton className='w-full' />
                        <TextLineSkeleton className='w-5/6' />
                        <TextLineSkeleton className='w-2/3' />
                    </div>
                )}

                {!isIngredientsLoading && ingredientGroups.length === 0 && (
                    <p className='mt-3 text-body text-text-secondary'>No ingredients yet.</p>
                )}

                {!isIngredientsLoading && ingredientGroups.length > 0 && (
                    <div className='mt-3 space-y-5'>
                        {ingredientGroups.map((group) => (
                            <div key={group.sectionId ?? 'ungrouped'}>
                                {group.name && (
                                    <h3 className='mb-1 px-3 text-label font-semibold uppercase tracking-wide text-text-secondary'>
                                        {group.name}
                                    </h3>
                                )}

                                <ul className='space-y-2'>
                                    {group.items.map((ingredient) => {
                                        const isChecked = checkedIds.has(ingredient.id);
                                        const scaledQuantity = scaleQuantity(ingredient.quantity, scaleFactor);

                                        return (
                                            <li key={ingredient.id}>
                                                <label
                                                    className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-body transition-colors duration-150 hover:bg-hover ${
                                                        isChecked ? 'bg-hover' : ''
                                                    }`}
                                                >
                                                    <span className='relative flex h-5 w-5 shrink-0 items-center justify-center'>
                                                        <input
                                                            type='checkbox'
                                                            checked={isChecked}
                                                            onChange={() => handleToggleIngredient(ingredient.id)}
                                                            className='sr-only'
                                                        />
                                                        <span
                                                            className={`h-5 w-5 rounded-sm border transition-colors duration-150 ${
                                                                isChecked
                                                                    ? 'border-accent bg-accent'
                                                                    : 'border-border-strong'
                                                            }`}
                                                        />
                                                        {isChecked && (
                                                            <Check
                                                                size={13}
                                                                className='animate-check-pop absolute inset-0 m-auto text-accent-foreground'
                                                            />
                                                        )}
                                                    </span>

                                                    <span
                                                        className={`text-button font-mono ${isChecked ? 'text-text-disabled' : 'text-text-secondary'}`}
                                                    >
                                                        {scaledQuantity ? `${scaledQuantity} ` : ''}
                                                        {ingredient.unit ?? ''}
                                                    </span>

                                                    <span
                                                        className={
                                                            isChecked
                                                                ? 'text-text-disabled line-through'
                                                                : 'text-text-primary'
                                                        }
                                                    >
                                                        {ingredient.name}
                                                    </span>
                                                </label>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {!isStepsLoading && stepGroups.length > 0 && (
                <div className='mt-6 rounded-lg border border-border bg-surface p-5'>
                    <h2 className='text-h2 font-semibold text-text-primary'>Instructions</h2>

                    <div className='mt-3 space-y-5'>
                        {stepGroups.map((group) => (
                            <div key={group.sectionId ?? 'ungrouped'}>
                                {group.name && (
                                    <h3 className='mb-2 text-label font-semibold uppercase tracking-wide text-text-secondary'>
                                        {group.name}
                                    </h3>
                                )}

                                <ol className='list-decimal space-y-2 pl-5 text-body text-text-secondary'>
                                    {group.items.map((step) => (
                                        <li key={step.id} className='pl-1'>
                                            {step.instruction}
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <LeaveButton />

            <Modal
                open={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                title='Delete recipe?'
                footer={
                    <>
                        <Button variant='secondary' onClick={() => setIsDeleteConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant='danger' onClick={handleDelete} disabled={deleteRecipe.isPending}>
                            {deleteRecipe.isPending ? 'Deleting…' : 'Delete'}
                        </Button>
                    </>
                }
            >
                {`Delete "${recipe.title}"? This can't be undone.`}
            </Modal>
        </div>
    );
}
