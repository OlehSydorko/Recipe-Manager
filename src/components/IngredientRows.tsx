'use client';

import { ALLOWED_UNITS, DEFAULT_UNIT, type IngredientDraft } from '@/types/ingredient';

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
            <span className='block text-sm font-medium'>Ingredients</span>

            <div className='mt-1 space-y-2'>
                {ingredients.map((ingredient) => (
                    <div key={ingredient.key} className='flex gap-2'>
                        <input
                            type='text'
                            inputMode='decimal'
                            value={ingredient.quantity}
                            onChange={(event) => handleQuantityChange(ingredient.key, event.target.value)}
                            placeholder='Qty'
                            className='w-20 rounded border px-3 py-2'
                        />
                        <select
                            value={ingredient.unit}
                            onChange={(event) => handleUnitChange(ingredient.key, event.target.value)}
                            className='w-24 rounded border px-3 py-2'
                        >
                            {ALLOWED_UNITS.map((unit) => (
                                <option key={unit} value={unit}>
                                    {unit}
                                </option>
                            ))}
                        </select>
                        <input
                            type='text'
                            value={ingredient.name}
                            onChange={(event) => handleNameChange(ingredient.key, event.target.value)}
                            placeholder='Ingredient'
                            className='flex-1 rounded border px-3 py-2'
                        />
                        <button
                            type='button'
                            onClick={() => handleRemoveRow(ingredient.key)}
                            disabled={ingredients.length === 1}
                            className='rounded border px-3 py-2 text-sm disabled:opacity-50'
                        >
                            Remove
                        </button>
                    </div>
                ))}
            </div>

            <button type='button' onClick={handleAddRow} className='mt-2 rounded border px-3 py-2 text-sm'>
                + Add ingredient
            </button>
        </div>
    );
}
