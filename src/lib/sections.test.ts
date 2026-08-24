import { describe, expect, it } from 'vitest';
import { groupBySection } from './sections';

type Item = { id: string; section_id: string | null };

const sectionA = { id: 'sec-a', name: 'Dough', recipe_id: 'r1', sort_order: 0 };
const sectionB = { id: 'sec-b', name: 'Filling', recipe_id: 'r1', sort_order: 1 };

describe('groupBySection', () => {
    it('returns one ungrouped group when no items have a section', () => {
        const items: Item[] = [
            { id: '1', section_id: null },
            { id: '2', section_id: null }
        ];

        expect(groupBySection([], items)).toEqual([{ items, name: null, sectionId: null }]);
    });

    it('puts ungrouped items first, ahead of named sections', () => {
        const items: Item[] = [
            { id: '1', section_id: sectionA.id },
            { id: '2', section_id: null }
        ];

        const groups = groupBySection([sectionA], items);

        expect(groups).toHaveLength(2);
        expect(groups[0].sectionId).toBeNull();
        expect(groups[1].sectionId).toBe(sectionA.id);
    });

    it('groups items under their section, preserving section order', () => {
        const items: Item[] = [
            { id: '1', section_id: sectionB.id },
            { id: '2', section_id: sectionA.id },
            { id: '3', section_id: sectionA.id }
        ];

        const groups = groupBySection([sectionA, sectionB], items);

        expect(groups.map((group) => group.name)).toEqual(['Dough', 'Filling']);
        expect(groups[0].items).toEqual([items[1], items[2]]);
        expect(groups[1].items).toEqual([items[0]]);
    });

    it('drops named sections that have no items', () => {
        const items: Item[] = [{ id: '1', section_id: sectionA.id }];

        const groups = groupBySection([sectionA, sectionB], items);

        expect(groups).toHaveLength(1);
        expect(groups[0].name).toBe('Dough');
    });

    it('returns an empty array for no items and no sections', () => {
        expect(groupBySection([], [])).toEqual([]);
    });
});
