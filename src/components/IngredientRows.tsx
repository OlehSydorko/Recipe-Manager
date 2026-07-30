'use client';

import { ALLOWED_UNITS, DEFAULT_UNIT, type IngredientDraft } from '@/types/ingredient';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';

// Keeps only digits, a single decimal point, and a single fraction slash
// (e.g. "1", "1.5", "1/2") — letters and any extra punctuation are dropped as typed.
function sanitizeQuantity(value: string): string {
    let cleaned = value.replace(/[^0-9./]/g, '');

    const firstDot = cleaned.indexOf('.');

    if (firstDot !== -1) {
        cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replaceAll('.', '');
    }

    const firstSlash = cleaned.indexOf('/');

    if (firstSlash !== -1) {
        cleaned = cleaned.slice(0, firstSlash + 1) + cleaned.slice(firstSlash + 1).replaceAll('/', '');
    }

    return cleaned;
}

export function createEmptyIngredientDraft(): IngredientDraft {
    return { key: crypto.randomUUID(), name: '', quantity: '', unit: DEFAULT_UNIT };
}

type IngredientRowsProps = {
    ingredients: IngredientDraft[];
    onChange: (ingredients: IngredientDraft[]) => void;
};

const FIELD_CLASSES =
    'h-11 rounded-sm border border-border bg-bg-secondary text-body text-text-primary transition-colors duration-150 placeholder:text-text-disabled focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15';

export function IngredientRows({ ingredients, onChange }: IngredientRowsProps) {
    const handleQuantityChange = (key: string, value: string) => {
        const quantity = sanitizeQuantity(value);

        onChange(ingredients.map((ingredient) => (ingredient.key === key ? { ...ingredient, quantity } : ingredient)));
    };

    const handleUnitChange = (key: string, value: string) => {
        onChange(
            ingredients.map((ingredient) => (ingredient.key === key ? { ...ingredient, unit: value } : ingredient))
        );
    };

    const handleNameChange = (key: string, value: string) => {
        onChange(
            ingredients.map((ingredient) => (ingredient.key === key ? { ...ingredient, name: value } : ingredient))
        );
    };

    const handleAddRow = () => {
        onChange([...ingredients, createEmptyIngredientDraft()]);
    };

    const handleRemoveRow = (key: string) => {
        onChange(ingredients.filter((ingredient) => ingredient.key !== key));
    };

    return (
        <div>
            <span className='block text-label font-medium text-text-secondary'>Ingredients</span>

            <div className='mt-2 space-y-2'>
                {ingredients.map((ingredient) => (
                    <div key={ingredient.key} className='flex gap-2'>
                        <input
                            type='text'
                            inputMode='decimal'
                            value={ingredient.quantity}
                            onChange={(event) => handleQuantityChange(ingredient.key, event.target.value)}
                            placeholder='Qty'
                            className={`w-16 px-2.5 text-center ${FIELD_CLASSES}`}
                        />

                        <div className='relative w-24 shrink-0'>
                            <select
                                value={ingredient.unit}
                                onChange={(event) => handleUnitChange(ingredient.key, event.target.value)}
                                className={`w-full appearance-none px-2.5 pr-7 ${FIELD_CLASSES}`}
                            >
                                {ALLOWED_UNITS.map((unit) => (
                                    <option key={unit} value={unit}>
                                        {unit}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown
                                size={14}
                                className='pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary'
                            />
                        </div>

                        <input
                            type='text'
                            value={ingredient.name}
                            onChange={(event) => handleNameChange(ingredient.key, event.target.value)}
                            placeholder='Ingredient'
                            className={`flex-1 px-3 ${FIELD_CLASSES}`}
                        />

                        <button
                            type='button'
                            onClick={() => handleRemoveRow(ingredient.key)}
                            disabled={ingredients.length === 1}
                            aria-label='Remove ingredient'
                            className='flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-text-secondary transition-colors duration-150 hover:bg-error-muted hover:text-error disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-secondary'
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>

            <button
                type='button'
                onClick={handleAddRow}
                className='mt-3 inline-flex items-center gap-1.5 rounded-md border border-border-strong px-3 py-2 text-button font-medium text-text-primary transition-colors duration-150 hover:bg-hover'
            >
                <Plus size={14} />
                Add ingredient
            </button>
        </div>
    );
}
