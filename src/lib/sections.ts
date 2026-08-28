import type { Section } from '@/types/section';

export type SectionGroup<T> = {
    sectionId: string | null;
    name: string | null;
    items: T[];
};

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
