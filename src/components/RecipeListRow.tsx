'use client';

import { useRecipeImageUrl } from '@/hooks/useRecipes';
import type { Recipe } from '@/types/recipe';
import { Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

type RecipeListRowProps = {
    recipe: Recipe;
    categoryName: string;
};

// List-view counterpart to RecipeCard, used when the profile page's view
// toggle is set to "list" instead of "grid".
export function RecipeListRow({ recipe, categoryName }: RecipeListRowProps) {
    const { data: imageUrl } = useRecipeImageUrl(recipe.image_url);

    return (
        <div className='group relative flex items-center gap-4 rounded-lg border border-border bg-surface p-3 transition-colors duration-150 hover:border-border-strong'>
            <Link href={`/recipes/${recipe.id}`} aria-label={recipe.title} className='absolute inset-0 z-0' />

            <div className='pointer-events-none relative z-10 h-16 w-16 shrink-0 overflow-hidden rounded-md bg-bg-secondary'>
                {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt={recipe.title} className='h-full w-full object-cover' />
                ) : (
                    <div className='flex h-full w-full items-center justify-center text-text-disabled'>
                        <ImageIcon size={18} />
                    </div>
                )}
            </div>

            <div className='pointer-events-none relative z-10 min-w-0 flex-1'>
                <h3 className='truncate text-h3 font-medium text-text-primary'>{recipe.title}</h3>
                <span className='mt-1 inline-flex rounded-full bg-accent-muted px-2.5 py-0.5 text-caption font-medium text-accent'>
                    {categoryName}
                </span>
            </div>
        </div>
    );
}
