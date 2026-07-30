'use client';

import { useRecipeImageUrl } from '@/hooks/useRecipes';
import type { Recipe } from '@/types/recipe';
import { Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

type RecipeCardProps = {
    recipe: Recipe;
    categoryName: string;
};

export function RecipeCard({ recipe, categoryName }: RecipeCardProps) {
    const { data: imageUrl } = useRecipeImageUrl(recipe.image_url);

    return (
        <Link
            href={`/recipes/${recipe.id}`}
            className='group block overflow-hidden rounded-lg border border-border bg-surface shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md'
        >
            <div className='aspect-[4/3] w-full overflow-hidden bg-bg-secondary'>
                {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={imageUrl}
                        alt={recipe.title}
                        className='h-full w-full object-cover transition-transform duration-150 group-hover:scale-[1.03]'
                    />
                ) : (
                    <div className='flex h-full w-full items-center justify-center text-text-disabled'>
                        <ImageIcon size={28} />
                    </div>
                )}
            </div>

            <div className='space-y-1.5 p-4'>
                <h3 className='text-h3 font-medium text-text-primary'>{recipe.title}</h3>

                <span className='inline-flex rounded-full bg-accent-muted px-2.5 py-0.5 text-caption font-medium text-accent'>
                    {categoryName}
                </span>

                {recipe.description && (
                    <p className='line-clamp-2 text-caption text-text-secondary'>{recipe.description}</p>
                )}
            </div>
        </Link>
    );
}
