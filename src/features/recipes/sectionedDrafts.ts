import type { Section, SectionDraft } from '@/types/section';

// Shared, non-visual helpers for editing a recipe's sections. Sections are one list,
// shared by both the Ingredients and Instructions panels (see SectionsManager.tsx) --
// these operate on that shared list plus whichever item-draft array (IngredientDraft[]
// or StepDraft[]) a caller passes in, so "Dough" reliably means the same section in
// both panels instead of two independently typed labels that can drift.

export function createEmptySectionDraft(): SectionDraft {
    return { key: crypto.randomUUID(), name: '' };
}

export function renameSection(sections: SectionDraft[], key: string, name: string): SectionDraft[] {
    return sections.map((section) => (section.key === key ? { ...section, name } : section));
}

export function removeSection(sections: SectionDraft[], key: string): SectionDraft[] {
    return sections.filter((section) => section.key !== key);
}

// Falls any item that referenced the removed section back to "no section" rather than
// leaving it pointing at a local key that no longer exists.
export function unassignSection<T extends { sectionKey: string | null }>(items: T[], key: string): T[] {
    return items.map((item) => (item.sectionKey === key ? { ...item, sectionKey: null } : item));
}

// Filters + trims section drafts down to what should actually be saved, in save order.
// A blank-named section is dropped -- anything still assigned to it in the same save
// resolves to "no section" via resolveSectionIds below, it never blocks the save.
export function namedSectionDrafts(sections: SectionDraft[]): SectionDraft[] {
    return sections.filter((section) => section.name.trim());
}

// `savedSections` must be the result of calling replaceSections with
// namedSectionDrafts(sections).map(section => section.name.trim()), in that order --
// api/sections.ts's replaceSections explicitly returns rows ordered by sort_order so
// this positional zip is reliable even when two sections share a name.
export function resolveSectionIds(sections: SectionDraft[], savedSections: Section[]): Map<string, string> {
    const map = new Map<string, string>();

    sections.forEach((section, index) => {
        const saved = savedSections[index];

        if (saved) {
            map.set(section.key, saved.id);
        }
    });

    return map;
}
