'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { RecipeCardSkeleton } from '@/components/ui/Skeleton';
import { CategoryFilter } from '@/features/recipes/components/CategoryFilter';
import { RecipeCard } from '@/features/recipes/components/RecipeCard';
import { useCategories } from '@/hooks/useCategories';
import { useRecipes } from '@/hooks/useRecipes';
import { BookOpen, Plus , Search } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function RecipesPage() {
    const searchParams = useSearchParams();
    const { data: recipes, isPending, isError } = useRecipes();
    const { data: categories } = useCategories();
    const [categoryFilter, setCategoryFilter] = useState('');
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') ?? '');

    const categoryNameById = new Map(categories?.map((category) => [category.id, category.name]));

    const filteredRecipes = recipes
        ?.filter((recipe) => !categoryFilter || recipe.category_id === categoryFilter)
        .filter((recipe) => !showFavoritesOnly || recipe.is_favorite)
        .filter(
            (recipe) => !searchQuery.toLowerCase() || recipe.title.toLowerCase().includes(searchQuery.toLowerCase())
        );

    const isFiltered = Boolean(categoryFilter) || showFavoritesOnly || Boolean(searchQuery.trim());

    return (
        <div>
            <div className='flex flex-wrap items-center justify-between gap-4'>
                <h1 className='text-display font-semibold text-text-primary'>Recipes</h1>

                <Link
                    href='/recipes/new'
                    className='inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-button font-medium text-accent-foreground shadow-sm transition-all duration-150 hover:bg-accent-hover hover:shadow-md active:scale-[0.98]'
                >
                    <Plus size={16} />
                    New recipe
                </Link>
            </div>

             <div className='relative hidden mt-5 sm:block'>
                <Search
                    size={17}
                    className='pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-disabled'
                />
                <Input
                    type='search'
                    placeholder='Search Recipes'
                    aria-label='Search Recipes'
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className='h-10 w-full rounded-full border border-border bg-bg-secondary pl-10 pr-4 text-body text-text-primary transition-colors duration-150 placeholder:text-text-disabled focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-60'
                />
            </div>

            <div className='mt-5'>
                <CategoryFilter
                    categories={categories}
                    value={categoryFilter}
                    onChange={setCategoryFilter}
                    showFavoritesOnly={showFavoritesOnly}
                    onToggleFavoritesOnly={() => setShowFavoritesOnly((previous) => !previous)}
                />
            </div>

            {isError && <p className='mt-8 text-body text-error'>Could not load recipes.</p>}

            {isPending && (
                <div className='mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
                    {Array.from({ length: 6 }).map((_, index) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <RecipeCardSkeleton key={index} />
                    ))}
                </div>
            )}

            {!isPending && !isError && filteredRecipes?.length === 0 && (
                <div className='mt-16 flex flex-col items-center gap-3 text-center'>
                    <BookOpen size={32} className='text-text-disabled' />
                    <p className='text-h3 font-medium text-text-primary'>
                        {isFiltered ? 'No recipes match these filters' : 'No recipes yet'}
                    </p>
                    <p className='text-body text-text-secondary'>
                        {isFiltered ? 'Try a different filter.' : 'Create your first recipe to get started.'}
                    </p>
                    {!isFiltered && (
                        <Link
                            href='/recipes/new'
                            className='mt-2 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-button font-medium text-accent-foreground shadow-sm transition-colors duration-150 hover:bg-accent-hover'
                        >
                            <Plus size={16} />
                            Create recipe
                        </Link>
                    )}
                </div>
            )}

            {!isPending && !isError && filteredRecipes && filteredRecipes.length > 0 && (
                <div className='mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
                    {filteredRecipes.map((recipe) => (
                        <RecipeCard
                            key={recipe.id}
                            recipe={recipe}
                            categoryName={categoryNameById.get(recipe.category_id) ?? 'Uncategorized'}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
