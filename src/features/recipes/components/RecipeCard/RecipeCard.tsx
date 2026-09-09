'use client';

import { FavoriteStar } from '@/features/recipes/components/FavoriteHeart';
import { RatingStars } from '@/features/recipes/components/RatingStars';
import { RecipeThumbnail } from '@/features/recipes/components/RecipeThumbnail';
import { useRecipeRatingSummary } from '@/hooks/useComments';
import { useRecipeImageUrl } from '@/hooks/useRecipes';
import type { Recipe, RecipeAuthor } from '@/types/recipe';
import { Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import styles from './RecipeCard.module.scss';

const CARD_RATING_STAR_SIZE = 12;

type RecipeCardProps = {
    recipe: Recipe;
    categoryName: string;
    hideFavorite?: boolean;
    author?: RecipeAuthor;
    // When true, always render the vertical image-on-top card, even below `sm`.
    // Used by 2-column mobile grids (Home) where a compact row layout wouldn't fit.
    hideMobileRow?: boolean;
};

export function RecipeCard({ recipe, categoryName, hideFavorite, author, hideMobileRow = false }: RecipeCardProps) {
    const { data: imageUrl } = useRecipeImageUrl(recipe.image_url);
    const { data: ratingSummary } = useRecipeRatingSummary(recipe.id);
    const hasRating = Boolean(ratingSummary && ratingSummary.averageRating !== null && ratingSummary.ratingCount > 0);

    return (
        <>
            {/* Mobile: a compact row — thumbnail left, title/category right. Hidden at sm and up
                (and entirely, when hideMobileRow is set, for grids that keep the card layout on mobile too). */}
            {!hideMobileRow && (
                <div className={styles.mobileRow}>
                    <Link href={`/recipes/${recipe.id}`} aria-label={recipe.title} className='absolute inset-0 z-0' />

                    <RecipeThumbnail
                        imagePath={recipe.image_url}
                        alt={recipe.title}
                        className='pointer-events-none relative z-10 h-24 w-24'
                        iconSize={24}
                    />

                    <div className='pointer-events-none relative z-10 min-w-0 flex-1 space-y-1'>
                        <h3 className={styles.rowTitle}>{recipe.title}</h3>

                        <span className={styles.categoryBadge}>{categoryName}</span>

                        {author && <p className={styles.authorLine}>by {author.displayName ?? 'Someone'}</p>}
                    </div>

                    {!hideFavorite && (
                        <div className={styles.rowFavorite}>
                            <FavoriteStar recipeId={recipe.id} isFavorite={recipe.is_favorite} />
                        </div>
                    )}
                </div>
            )}

            {/* Tablet/desktop: the original vertical, image-on-top card. Hidden below sm, unless
                hideMobileRow is set (Home's 2-column mobile grid wants the card at every size). */}
            <div className={`${styles.card} ${hideMobileRow ? 'block' : 'hidden sm:block'}`}>
                {/* Link overlay covers the whole card so it stays clickable everywhere except
                    the star badge below, which sits above it (z-20) in its own stacking layer. */}
                <Link href={`/recipes/${recipe.id}`} aria-label={recipe.title} className='absolute inset-0 z-0' />

                <div className='pointer-events-none relative z-10'>
                    <div className={styles.imageWrapper}>
                        {imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={imageUrl} alt={recipe.title} className={styles.recipeImage} />
                        ) : (
                            <div className='flex h-full w-full items-center justify-center text-text-disabled'>
                                <ImageIcon size={28} />
                            </div>
                        )}
                    </div>

                    <div className='space-y-1.5 p-3 sm:p-4'>
                        <h3 className={styles.cardTitle}>{recipe.title}</h3>

                        <span className={styles.categoryBadge}>{categoryName}</span>

                        {hasRating && ratingSummary && (
                            <div className='flex items-center gap-1.5 text-caption text-text-secondary'>
                                <RatingStars value={Math.round(ratingSummary.averageRating ?? 0)} size={CARD_RATING_STAR_SIZE} />
                                <span>
                                    {ratingSummary.averageRating?.toFixed(1)} ({ratingSummary.ratingCount})
                                </span>
                            </div>
                        )}

                        {author && <p className={styles.authorLine}>by {author.displayName ?? 'Someone'}</p>}
                    </div>
                </div>

                {/* Top-right corner badge, over the image — not inside the pointer-events-none
                    content wrapper above, so it's clickable without extra overrides. */}
                {!hideFavorite && (
                    <div className={styles.cardFavorite}>
                        <FavoriteStar recipeId={recipe.id} isFavorite={recipe.is_favorite} />
                    </div>
                )}
            </div>
        </>
    );
}
