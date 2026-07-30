'use client';

import { useState } from 'react';
import { CategoryFilter } from '@/components/CategoryFilter';
import { RecipeCard } from '@/components/RecipeCard';
import { RecipeCardSkeleton } from '@/components/ui/Skeleton';
import { useCategories } from '@/hooks/useCategories';
import { useRecipes } from '@/hooks/useRecipes';
import { BookOpen, Plus } from 'lucide-react';
import Link from 'next/link';

export default function RecipesPage() {
    const { data: recipes, isPending, isError } = useRecipes();
    const { data: categories } = useCategories();
    const [categoryFilter, setCategoryFilter] = useState('');

    const categoryNameById = new Map(categories?.map((category) => [category.id, category.name]));

    const filteredRecipes = categoryFilter
        ? recipes?.filter((recipe) => recipe.category_id === categoryFilter)
        : recipes;

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

            <div className='mt-5'>
                <CategoryFilter categories={categories} value={categoryFilter} onChange={setCategoryFilter} />
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
                        {categoryFilter ? 'No recipes in this category yet' : 'No recipes yet'}
                    </p>
                    <p className='text-body text-text-secondary'>
                        {categoryFilter ? 'Try a different category.' : 'Create your first recipe to get started.'}
                    </p>
                    {!categoryFilter && (
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
