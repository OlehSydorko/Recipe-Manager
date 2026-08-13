'use client';

import { FavoriteStar } from '@/features/recipes/components/FavoriteStar';
import { useRecipeImageUrl } from '@/hooks/useRecipes';
import type { Recipe, RecipeAuthor } from '@/types/recipe';
import { Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

type RecipeCardProps = {
    recipe: Recipe;
    categoryName: string;
    hideFavorite?: boolean;
    // Only passed on the Community tab — omitted for "My Recipes", where
    // showing your own name on every card would be noise. Plain text rather
    // than a link to /profile/[id]: the whole card is already one giant link
    // overlay (see below), and nesting a second link inside it isn't valid HTML.
    author?: RecipeAuthor;
};

export function RecipeCard({ recipe, categoryName, hideFavorite, author }: RecipeCardProps) {
    const { data: imageUrl } = useRecipeImageUrl(recipe.image_url);

    return (
        <div className='group relative overflow-hidden rounded-lg border border-border bg-surface shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md'>
            {/* Link overlay covers the whole card so it stays clickable everywhere except
                the star badge below, which sits above it (z-20) in its own stacking layer. */}
            <Link href={`/recipes/${recipe.id}`} aria-label={recipe.title} className='absolute inset-0 z-0' />

            <div className='pointer-events-none relative z-10'>
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

                    {author && (
                        <p className='truncate text-caption text-text-disabled'>
                            by {author.displayName ?? 'Someone'}
                        </p>
                    )}
                </div>
            </div>

            {/* Top-right corner badge, over the image — not inside the pointer-events-none
                content wrapper above, so it's clickable without extra overrides. */}
            {!hideFavorite && (
                <div className='absolute right-2 top-2 z-20 rounded-full bg-bg/70 backdrop-blur-sm'>
                    <FavoriteStar recipeId={recipe.id} isFavorite={recipe.is_favorite} />
                </div>
            )}
        </div>
    );
}
