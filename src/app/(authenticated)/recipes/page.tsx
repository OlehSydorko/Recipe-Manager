'use client';

import Link from 'next/link';

import { useRecipes } from '@/hooks/useRecipes';

export default function RecipesPage() {
    const { data: recipes, isPending, isError } = useRecipes();

    if (isPending) {
        return <p className='text-sm text-gray-600'>Loading recipes…</p>;
    }

    if (isError) {
        return <p className='text-sm text-red-600'>Could not load recipes.</p>;
    }

    return (
        <div>
            <div className='flex items-center justify-between'>
                <h1 className='text-2xl font-semibold'>Recipes</h1>
                <Link href='/recipes/new' className='rounded bg-black px-4 py-2 text-sm text-white'>
                    New recipe
                </Link>
            </div>

            {recipes.length === 0 ? (
                <p className='mt-6 text-sm text-gray-600'>No recipes yet — create your first one.</p>
            ) : (
                <ul className='mt-6 space-y-2'>
                    {recipes.map((recipe) => (
                        <li key={recipe.id}>
                            <Link
                                href={`/recipes/${recipe.id}`}
                                className='block rounded border px-3 py-2 hover:bg-gray-50'
                            >
                                {recipe.title}
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
