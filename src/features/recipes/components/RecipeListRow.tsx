'use client';

import { RecipeThumbnail } from '@/features/recipes/components/RecipeThumbnail';
import type { Recipe } from '@/types/recipe';
import Link from 'next/link';

type RecipeListRowProps = {
    recipe: Recipe;
    categoryName: string;
};

export function RecipeListRow({ recipe, categoryName }: RecipeListRowProps) {
    return (
        <div className='group relative flex items-center gap-4 rounded-lg border border-border bg-surface p-3 transition-colors duration-150 hover:border-border-strong'>
            <Link href={`/recipes/${recipe.id}`} aria-label={recipe.title} className='absolute inset-0 z-0' />

            <RecipeThumbnail
                imagePath={recipe.image_url}
                alt={recipe.title}
                className='pointer-events-none relative z-10 h-16 w-16'
                iconSize={18}
            />

            <div className='pointer-events-none relative z-10 min-w-0 flex-1'>
                <h3 className='truncate text-h3 font-medium text-text-primary'>{recipe.title}</h3>
                <span className='mt-1 inline-flex rounded-full bg-accent-muted px-2.5 py-0.5 text-caption font-medium text-accent'>
                    {categoryName}
                </span>
            </div>
        </div>
    );
}
