'use client';

import { RatingStars } from '@/features/recipes/components/RatingStars';
import { useRecipeRatingSummary } from '@/hooks/useComments';

type RecipeRatingSummaryProps = {
    recipeId: string;
};

export function RecipeRatingSummary({ recipeId }: RecipeRatingSummaryProps) {
    const { data: summary, isPending } = useRecipeRatingSummary(recipeId);

    if (isPending || !summary || summary.averageRating === null || summary.ratingCount === 0) {
        return null;
    }

    return (
        <div className='mt-1 flex items-center gap-1.5 text-label text-text-secondary'>
            {/* RatingStars renders whole stars only, so the average is rounded for display;
                the precise figure is still shown as text right after it. */}
            <RatingStars value={Math.round(summary.averageRating)} size={14} />
            <span>
                {summary.averageRating.toFixed(1)} · {summary.ratingCount} rating{summary.ratingCount === 1 ? '' : 's'}
            </span>
        </div>
    );
}
