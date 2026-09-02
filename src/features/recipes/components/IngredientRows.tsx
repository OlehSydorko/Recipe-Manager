'use client';

import { normalizeQuantity } from '@/lib/quantity';
import { ALLOWED_UNITS, DEFAULT_UNIT, type IngredientDraft } from '@/types/ingredient';
import type { SectionDraft } from '@/types/section';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';

function sanitizeQuantity(value: string): string {
    let cleaned = normalizeQuantity(value).replace(/[^0-9./]/g, '');

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

export function createEmptyIngredientDraft(sectionKey: string | null = null): IngredientDraft {
    return { key: crypto.randomUUID(), name: '', quantity: '', sectionKey, unit: DEFAULT_UNIT };
}

type IngredientRowsProps = {
    ingredients: IngredientDraft[];
    sections: SectionDraft[];
    onChange: (ingredients: IngredientDraft[]) => void;
};

const FIELD_CLASSES =
    'h-11 rounded-sm border border-border bg-bg-secondary text-body text-text-primary transition-colors duration-150 placeholder:text-text-disabled focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15';

export function IngredientRows({ ingredients, sections, onChange }: IngredientRowsProps) {
    const handleNameChange = (key: string, value: string) => {
        onChange(
            ingredients.map((ingredient) => (ingredient.key === key ? { ...ingredient, name: value } : ingredient))
        );
    };

    const handleQuantityChange = (key: string, value: string) => {
        const quantity = sanitizeQuantity(value);

        onChange(ingredients.map((ingredient) => (ingredient.key === key ? { ...ingredient, quantity } : ingredient)));
    };

    const handleUnitChange = (key: string, value: string) => {
        onChange(
            ingredients.map((ingredient) => (ingredient.key === key ? { ...ingredient, unit: value } : ingredient))
        );
    };

    const handleSectionChange = (key: string, value: string) => {
        onChange(
            ingredients.map((ingredient) =>
                ingredient.key === key ? { ...ingredient, sectionKey: value || null } : ingredient
            )
        );
    };

    const handleAddRow = () => {
        onChange([...ingredients, createEmptyIngredientDraft()]);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleAddRow();
        }
    };

    const handleRemoveRow = (key: string) => {
        onChange(ingredients.filter((ingredient) => ingredient.key !== key));
    };

    return (
        <div>
            <span className='block text-label font-medium text-text-secondary'>Ingredients</span>

            <div className='mt-2 space-y-2'>
                {ingredients.map((ingredient) => (
                    <div key={ingredient.key} className='flex flex-wrap gap-2'>
                        <input
                            type='text'
                            value={ingredient.name}
                            onChange={(event) => handleNameChange(ingredient.key, event.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder='Ingredient'
                            className={`min-w-[8rem] flex-1 px-3 ${FIELD_CLASSES}`}
                        />
                        <input
                            type='text'
                            inputMode='decimal'
                            value={ingredient.quantity}
                            onChange={(event) => handleQuantityChange(ingredient.key, event.target.value)}
                            onKeyDown={handleKeyDown}
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

                        {sections.length > 0 && (
                            <div className='relative w-32 shrink-0'>
                                <select
                                    value={ingredient.sectionKey ?? ''}
                                    onChange={(event) => handleSectionChange(ingredient.key, event.target.value)}
                                    aria-label='Section'
                                    className={`w-full appearance-none px-2.5 pr-7 ${FIELD_CLASSES}`}
                                >
                                    <option value=''>No section</option>
                                    {sections.map((section) => (
                                        <option key={section.key} value={section.key}>
                                            {section.name || 'Untitled section'}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown
                                    size={14}
                                    className='pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary'
                                />
                            </div>
                        )}

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
