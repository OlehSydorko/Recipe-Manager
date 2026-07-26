'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useDeleteRecipe, useRecipe } from '@/hooks/useRecipes';

type RecipeDetailPageProps = {
    params: Promise<{ id: string }>;
};

export default function RecipeDetailPage({ params }: RecipeDetailPageProps) {
    const { id } = use(params);
    const router = useRouter();
    const { data: recipe, isPending, isError } = useRecipe(id);
    const deleteRecipe = useDeleteRecipe();

    const handleDelete = () => {
        deleteRecipe.mutate(id, {
            onSuccess: () => router.push('/recipes')
        });
    };

    if (isPending) {
        return <p className='text-sm text-gray-600'>Loading recipe…</p>;
    }

    if (isError || !recipe) {
        return <p className='text-sm text-red-600'>Recipe not found.</p>;
    }

    return (
        <div>
            <div className='flex items-center justify-between'>
                <h1 className='text-2xl font-semibold'>{recipe.title}</h1>
                <div className='flex gap-2'>
                    <Link href={`/recipes/${recipe.id}/edit`} className='rounded border px-3 py-2 text-sm'>
                        Edit
                    </Link>
                    <button
                        type='button'
                        onClick={handleDelete}
                        disabled={deleteRecipe.isPending}
                        className='rounded border border-red-600 px-3 py-2 text-sm text-red-600 disabled:opacity-50'
                    >
                        Delete
                    </button>
                </div>
            </div>

            {recipe.description && <p className='mt-4 text-sm text-gray-600'>{recipe.description}</p>}
        </div>
    );
}
