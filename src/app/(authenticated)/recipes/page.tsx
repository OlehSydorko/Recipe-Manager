'use client';

import { useState } from 'react';
import Link from 'next/link';

import { CategoryFilter } from '@/components/CategoryFilter';
import { useCategories } from '@/hooks/useCategories';
import { useRecipes } from '@/hooks/useRecipes';

export default function RecipesPage() {
    const { data: recipes, isPending, isError } = useRecipes();
    const { data: categories } = useCategories();
    const [categoryFilter, setCategoryFilter] = useState('');

    const categoryNameById = new Map(categories?.map((category) => [category.id, category.name]));

    if (isPending) {
        return <p className='text-sm text-gray-600'>Loading recipes…</p>;
    }

    if (isError) {
        return <p className='text-sm text-red-600'>Could not load recipes.</p>;
    }

    const filteredRecipes = categoryFilter
        ? recipes.filter((recipe) => recipe.category_id === categoryFilter)
        : recipes;

    return (
        <div>
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                    <h1 className='text-2xl font-semibold'>Recipes</h1>
                    <CategoryFilter categories={categories} value={categoryFilter} onChange={setCategoryFilter} />
                </div>
                <Link href='/recipes/new' className='rounded bg-black px-4 py-2 text-sm text-white'>
                    New recipe
                </Link>
            </div>

            {filteredRecipes.length === 0 ? (
                <p className='mt-6 text-sm text-gray-600'>
                    {categoryFilter ? 'No recipes in this category yet.' : 'No recipes yet — create your first one.'}
                </p>
            ) : (
                <ul className='mt-6 space-y-2'>
                    {filteredRecipes.map((recipe) => (
                        <li key={recipe.id}>
                            <Link
                                href={`/recipes/${recipe.id}`}
                                className='flex items-center justify-between rounded border px-3 py-2 hover:bg-gray-50'
                            >
                                <span>{recipe.title}</span>
                                <span className='rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600'>
                                    {categoryNameById.get(recipe.category_id) ?? 'Uncategorized'}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
