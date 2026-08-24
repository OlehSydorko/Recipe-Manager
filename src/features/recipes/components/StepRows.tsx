'use client';

import type { SectionDraft } from '@/types/section';
import type { StepDraft } from '@/types/step';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';

export function createEmptyStepDraft(sectionKey: string | null = null): StepDraft {
    return { instruction: '', key: crypto.randomUUID(), sectionKey };
}

type StepRowsProps = {
    steps: StepDraft[];
    sections: SectionDraft[];
    onChange: (steps: StepDraft[]) => void;
};

const FIELD_CLASSES =
    'rounded-sm border border-border bg-bg-secondary text-body text-text-primary transition-colors duration-150 placeholder:text-text-disabled focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15';

// Mirrors IngredientRows.tsx's row-editing shape (flat list + an optional per-row
// Section dropdown fed by the shared `sections` list, see SectionsManager.tsx) rather
// than a nested drag-into-groups editor -- the recipe detail page still renders steps
// grouped under headings (see RecipeDetailClient.tsx / lib/sections.ts), this is just
// how a section gets assigned while editing. The numbering here is the row's position
// in this flat list, as an ordering aid while editing; the detail page numbers each
// section's steps starting from 1 instead.
export function StepRows({ steps, sections, onChange }: StepRowsProps) {
    const handleInstructionChange = (key: string, value: string) => {
        onChange(steps.map((step) => (step.key === key ? { ...step, instruction: value } : step)));
    };

    const handleSectionChange = (key: string, value: string) => {
        onChange(steps.map((step) => (step.key === key ? { ...step, sectionKey: value || null } : step)));
    };

    const handleAddRow = () => {
        onChange([...steps, createEmptyStepDraft()]);
    };

    const handleRemoveRow = (key: string) => {
        onChange(steps.filter((step) => step.key !== key));
    };

    return (
        <div>
            <span className='block text-label font-medium text-text-secondary'>Instructions</span>

            <div className='mt-2 space-y-2'>
                {steps.map((step, index) => (
                    <div key={step.key} className='flex flex-wrap items-start gap-2'>
                        <span className='flex h-11 w-6 shrink-0 items-center justify-center text-button text-text-disabled'>
                            {index + 1}.
                        </span>

                        <textarea
                            value={step.instruction}
                            onChange={(event) => handleInstructionChange(step.key, event.target.value)}
                            placeholder='Step instruction'
                            rows={2}
                            className={`min-w-[8rem] flex-1 px-3 py-2.5 ${FIELD_CLASSES}`}
                        />

                        {sections.length > 0 && (
                            <div className='relative w-32 shrink-0'>
                                <select
                                    value={step.sectionKey ?? ''}
                                    onChange={(event) => handleSectionChange(step.key, event.target.value)}
                                    aria-label='Section'
                                    className={`h-11 w-full appearance-none px-2.5 pr-7 ${FIELD_CLASSES}`}
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
                            onClick={() => handleRemoveRow(step.key)}
                            disabled={steps.length === 1}
                            aria-label='Remove step'
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
                Add step
            </button>
        </div>
    );
}
