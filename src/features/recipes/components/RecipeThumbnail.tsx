'use client';

import { useRecipeImageUrl } from '@/hooks/useRecipes';
import { Image as ImageIcon } from 'lucide-react';

type RecipeThumbnailProps = {
    imagePath: string | null;
    alt: string;
    // Sizing + positioning classes for the thumbnail box, e.g. 'h-9 w-9'.
    className?: string;
    // Fallback icon size, in px — should roughly match the box size above.
    iconSize?: number;
};

export function RecipeThumbnail({ imagePath, alt, className = 'h-full w-full', iconSize = 24 }: RecipeThumbnailProps) {
    const { data: imageUrl } = useRecipeImageUrl(imagePath);

    return (
        <div className={`shrink-0 overflow-hidden rounded-md bg-bg-secondary ${className}`}>
            {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt={alt} className='h-full w-full object-cover' />
            ) : (
                <div className='flex h-full w-full items-center justify-center text-text-disabled'>
                    <ImageIcon size={iconSize} />
                </div>
            )}
        </div>
    );
}
