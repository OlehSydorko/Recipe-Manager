'use client';

import { Star } from 'lucide-react';

type RatingStarsProps = {
    value: number;
    onChange?: (value: number) => void;
    size?: number;
};

const STAR_VALUES = [1, 2, 3, 4, 5];

export function RatingStars({ value, onChange, size = 18 }: RatingStarsProps) {
    const isInteractive = Boolean(onChange);

    return (
        <div
            role={isInteractive ? 'radiogroup' : undefined}
            aria-label={isInteractive ? 'Rating' : undefined}
            className='inline-flex items-center gap-0.5'
        >
            {STAR_VALUES.map((starValue) => {
                const isFilled = starValue <= value;
                const starClassName = isFilled ? 'fill-warning text-warning' : 'text-border-strong';

                if (!isInteractive) {
                    return <Star key={starValue} size={size} className={starClassName} />;
                }

                return (
                    <button
                        key={starValue}
                        type='button'
                        role='radio'
                        aria-checked={starValue === value}
                        aria-label={`${starValue} star${starValue === 1 ? '' : 's'}`}
                        onClick={() => onChange?.(starValue)}
                        className='p-0.5 transition-transform duration-150 hover:scale-110'
                    >
                        <Star size={size} className={starClassName} />
                    </button>
                );
            })}
        </div>
    );
}
