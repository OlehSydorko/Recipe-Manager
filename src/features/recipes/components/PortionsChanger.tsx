'use client';

import { IconButton } from '@/components/ui/IconButton';
import { Minus, Plus } from 'lucide-react';

const MIN_PORTIONS = 1;
const MAX_PORTIONS = 50;

type PortionsChangerProps = {
    value: number;
    onChange: (value: number) => void;
};

export function PortionsChanger({ value, onChange }: PortionsChangerProps) {
    const handleDecrement = () => {
        onChange(Math.max(MIN_PORTIONS, value - 1));
    };

    const handleIncrement = () => {
        onChange(Math.min(MAX_PORTIONS, value + 1));
    };

    return (
        <div className='inline-flex items-center gap-2 rounded-full border border-border bg-surface pl-1 pr-1'>
            <IconButton aria-label='Decrease portions' onClick={handleDecrement} disabled={value <= MIN_PORTIONS}>
                <Minus size={14} />
            </IconButton>

            <span className='min-w-[5.5rem] text-center text-button font-medium text-text-primary'>
                {value} {value === 1 ? 'portion' : 'portions'}
            </span>

            <IconButton aria-label='Increase portions' onClick={handleIncrement} disabled={value >= MAX_PORTIONS}>
                <Plus size={14} />
            </IconButton>
        </div>
    );
}
