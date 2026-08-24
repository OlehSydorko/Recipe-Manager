import type { Section } from '@/types/section';

export type SectionGroup<T> = {
    sectionId: string | null;
    name: string | null;
    items: T[];
};

// Groups items (ingredients or steps) by the section they belong to, for display on
// the recipe detail page. `sections` should already be sorted by sort_order, and
// `items` by their own sort_order -- this only groups, it doesn't re-sort either list.
// Ungrouped items (section_id null) come first as their own heading-less group, ahead
// of any named section, so a recipe with no sections renders exactly as it did before
// this feature existed. Named sections with no items are dropped -- nothing to show on
// the detail page (the editing form handles empty sections separately, since it needs
// to show them so ingredients/steps can still be added to a section that was just
// created).
export function groupBySection<T extends { section_id: string | null }>(
    sections: Section[],
    items: T[]
): SectionGroup<T>[] {
    const groups: SectionGroup<T>[] = [];
    const ungrouped = items.filter((item) => item.section_id === null);

    if (ungrouped.length > 0) {
        groups.push({ items: ungrouped, name: null, sectionId: null });
    }

    for (const section of sections) {
        const sectionItems = items.filter((item) => item.section_id === section.id);

        if (sectionItems.length > 0) {
            groups.push({ items: sectionItems, name: section.name, sectionId: section.id });
        }
    }

    return groups;
}
