'use client';

import type { IngredientDraft } from '@/types/ingredient';

const UNIT_DATALIST_ID = 'ingredient-unit-options';

// Suggestions only — the unit input stays free text so unlisted units still work.
const DEFAULT_UNITS = ['g', 'kg', 'ml', 'l', 'tsp', 'Tbsp', 'cup', 'oz', 'lb', 'pinch', 'clove', 'piece'];

export function createEmptyIngredientDraft(): IngredientDraft {
    return { key: crypto.randomUUID(), name: '', quantity: '', unit: '' };
}

type IngredientRowsProps = {
    ingredients: IngredientDraft[];
    onChange: (ingredients: IngredientDraft[]) => void;
};

export function IngredientRows({ ingredients, onChange }: IngredientRowsProps) {
    const handleQuantityChange = (key: string, value: string) => {
        onChange(
            ingredients.map((ingredient) => (ingredient.key === key ? { ...ingredient, quantity: value } : ingredient))
        );
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
                            value={ingredient.quantity}
                            onChange={(event) => handleQuantityChange(ingredient.key, event.target.value)}
                            placeholder='Qty'
                            className='w-20 rounded border px-3 py-2'
                        />
                        <input
                            type='text'
                            value={ingredient.unit}
                            onChange={(event) => handleUnitChange(ingredient.key, event.target.value)}
                            placeholder='Unit'
                            list={UNIT_DATALIST_ID}
                            className='w-24 rounded border px-3 py-2'
                        />
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

            <datalist id={UNIT_DATALIST_ID}>
                {DEFAULT_UNITS.map((unit) => (
                    <option key={unit} value={unit} />
                ))}
            </datalist>
        </div>
    );
}
