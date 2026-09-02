'use client';

import { useState } from 'react';
import { IconButton } from '@/components/ui/IconButton';
import { AddFromRecipeModal } from '@/features/shopping-list/components/AddFromRecipeModal';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { ShoppingCart } from 'lucide-react';

type AddToShoppingListButtonProps = {
    recipeId: string;
    scaleFactor?: number;
};

export function AddToShoppingListButton({ recipeId, scaleFactor = 1 }: AddToShoppingListButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { requireAuth, authGate } = useRequireAuth('Sign in to add ingredients to your shopping list.');

    return (
        <>
            <IconButton aria-label='Add to shopping list' onClick={() => requireAuth(() => setIsOpen(true))}>
                <ShoppingCart size={18} />
            </IconButton>
            {authGate}

            <AddFromRecipeModal
                open={isOpen}
                onClose={() => setIsOpen(false)}
                recipeId={recipeId}
                scaleFactor={scaleFactor}
            />
        </>
    );
}
