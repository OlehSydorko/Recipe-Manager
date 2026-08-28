import type { Section, SectionDraft } from '@/types/section';

export function createEmptySectionDraft(): SectionDraft {
    return { key: crypto.randomUUID(), name: '' };
}

export function renameSection(sections: SectionDraft[], key: string, name: string): SectionDraft[] {
    return sections.map((section) => (section.key === key ? { ...section, name } : section));
}

export function removeSection(sections: SectionDraft[], key: string): SectionDraft[] {
    return sections.filter((section) => section.key !== key);
}

export function unassignSection<T extends { sectionKey: string | null }>(items: T[], key: string): T[] {
    return items.map((item) => (item.sectionKey === key ? { ...item, sectionKey: null } : item));
}

export function namedSectionDrafts(sections: SectionDraft[]): SectionDraft[] {
    return sections.filter((section) => section.name.trim());
}

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
