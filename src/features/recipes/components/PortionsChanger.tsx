'use client';

import { IconButton } from '@/components/ui/IconButton';
import { Minus, Plus } from 'lucide-react';

const MIN_SERVINGS = 1;
const MAX_SERVINGS = 50;

type ServingsChangerProps = {
    value: number;
    onChange: (value: number) => void;
};

export function PortionsChanger({ value, onChange }: ServingsChangerProps) {
    const handleDecrement = () => {
        onChange(Math.max(MIN_SERVINGS, value - 1));
    };

    const handleIncrement = () => {
        onChange(Math.min(MAX_SERVINGS, value + 1));
    };

    return (
        <div className='inline-flex items-center gap-2 rounded-full border border-border bg-surface pl-1 pr-1'>
            <IconButton aria-label='Decrease servings' onClick={handleDecrement} disabled={value <= MIN_SERVINGS}>
                <Minus size={14} />
            </IconButton>

            <span className='min-w-[5.5rem] text-center text-button font-medium text-text-primary'>
                {value} {value === 1 ? 'serving' : 'servings'}
            </span>

            <IconButton aria-label='Increase servings' onClick={handleIncrement} disabled={value >= MAX_SERVINGS}>
                <Plus size={14} />
            </IconButton>
        </div>
    );
}
