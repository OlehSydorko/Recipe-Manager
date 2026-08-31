import type { ReactNode } from 'react';
import { RecipeCardSkeleton } from '@/components/ui/Skeleton';
import { RecipeCard } from '@/features/recipes/components/RecipeCard';
import type { Recipe, RecipeWithAuthor } from '@/types/recipe';
import { BookOpen } from 'lucide-react';
import Link from 'next/link';

type HomeRecipeSectionProps = {
    title: string;
    viewAllHref: string;
    recipes: (Recipe | RecipeWithAuthor)[];
    isPending: boolean;
    isError: boolean;
    skeletonCount: number;
    emptyTitle: string;
    emptyDescription: string;
    emptyAction?: ReactNode;
    categoryNameById?: Map<string, string>;
    hideWhenEmpty?: boolean;
};

export function HomeRecipeSection({
    title,
    viewAllHref,
    recipes,
    isPending,
    isError,
    skeletonCount,
    emptyTitle,
    emptyDescription,
    emptyAction,
    categoryNameById,
    hideWhenEmpty = false
}: HomeRecipeSectionProps) {
    if (hideWhenEmpty && !isPending && !isError && recipes.length === 0) {
        return null;
    }

    return (
        <section>
            <div className='flex items-center justify-between'>
                <h2 className='text-h2 font-semibold text-text-primary'>{title}</h2>
                <Link href={viewAllHref} className='text-label font-medium text-accent hover:text-accent-hover'>
                    View all
                </Link>
            </div>

            {isError && <p className='mt-4 text-body text-error'>Could not load recipes.</p>}

            {isPending && (
                <div className='mt-4 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4'>
                    {Array.from({ length: skeletonCount }).map((_, index) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <RecipeCardSkeleton key={index} />
                    ))}
                </div>
            )}

            {!isPending && !isError && recipes.length === 0 && (
                <div className='mt-8 flex flex-col items-center gap-3 text-center'>
                    <BookOpen size={32} className='text-text-disabled' />
                    <p className='text-h3 font-medium text-text-primary'>{emptyTitle}</p>
                    <p className='text-body text-text-secondary'>{emptyDescription}</p>
                    {emptyAction}
                </div>
            )}

            {!isPending && !isError && recipes.length > 0 && (
                <div className='mt-4 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4'>
                    {recipes.map((recipe) => (
                        <RecipeCard
                            key={recipe.id}
                            recipe={recipe}
                            categoryName={
                                'categoryName' in recipe
                                    ? (recipe.categoryName ?? 'Uncategorized')
                                    : (categoryNameById?.get(recipe.category_id) ?? 'Uncategorized')
                            }
                            author={'author' in recipe ? recipe.author : undefined}
                            hideMobileRow
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
