'use client';

import type { SectionDraft } from '@/types/section';
import { Plus, Trash2 } from 'lucide-react';

type SectionsManagerProps = {
    sections: SectionDraft[];
    onAdd: () => void;
    onRename: (key: string, name: string) => void;
    onRemove: (key: string) => void;
};

const FIELD_CLASSES =
    'h-11 flex-1 rounded-sm border border-border bg-bg-secondary px-3 text-body text-text-primary transition-colors duration-150 placeholder:text-text-disabled focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15';

export function SectionsManager({ sections, onAdd, onRename, onRemove }: SectionsManagerProps) {
    return (
        <div>
            <span className='block text-label font-medium text-text-secondary'>
                Sections <span className='font-normal text-text-disabled'>(optional)</span>
            </span>
            <p className='mt-1 text-label text-text-disabled'>
                Group ingredients and steps under headings, e.g. &ldquo;Dough&rdquo; or &ldquo;Filling&rdquo;.
            </p>

            {sections.length > 0 && (
                <div className='mt-2 space-y-2'>
                    {sections.map((section) => (
                        <div key={section.key} className='flex gap-2'>
                            <input
                                type='text'
                                value={section.name}
                                onChange={(event) => onRename(section.key, event.target.value)}
                                placeholder='Section name'
                                className={FIELD_CLASSES}
                            />
                            <button
                                type='button'
                                onClick={() => onRemove(section.key)}
                                aria-label='Remove section'
                                className='flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-text-secondary transition-colors duration-150 hover:bg-error-muted hover:text-error'
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <button
                type='button'
                onClick={onAdd}
                className='mt-3 inline-flex items-center gap-1.5 rounded-md border border-border-strong px-3 py-2 text-button font-medium text-text-primary transition-colors duration-150 hover:bg-hover'
            >
                <Plus size={14} />
                Add section
            </button>
        </div>
    );
}
