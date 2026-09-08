'use client';

import type { MouseEvent } from 'react';
import { IconButton } from '@/components/ui/IconButton';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useSetRecipeFavorite } from '@/hooks/useRecipes';
import { Heart } from 'lucide-react';

type FavoriteStarProps = {
    recipeId: string;
    isFavorite: boolean;
};

export function FavoriteStar({ recipeId, isFavorite }: FavoriteStarProps) {
    const setFavorite = useSetRecipeFavorite();
    const { requireAuth, authGate } = useRequireAuth('Sign in to favorite recipes.');

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();
        requireAuth(() => setFavorite.mutate({ id: recipeId, isFavorite: !isFavorite }));
    };

    return (
        <>
            <IconButton
                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                aria-pressed={isFavorite}
                onClick={handleClick}
            >
                <Heart size={18} className={isFavorite ? 'fill-accent text-accent' : ''} />
            </IconButton>
            {authGate}
        </>
    );
}
