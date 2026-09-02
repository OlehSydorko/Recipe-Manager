import { SHOPPING_SECTIONS, SHOPPING_SECTION_LABELS, type ShoppingListItem } from '@/types/shoppingListItem';

export type ShoppingSectionGroup = {
    section: ShoppingListItem['section'];
    label: string;
    items: ShoppingListItem[];
};

export function groupByShoppingSection(items: ShoppingListItem[]): ShoppingSectionGroup[] {
    const groups: ShoppingSectionGroup[] = [];

    for (const section of SHOPPING_SECTIONS) {
        const sectionItems = items.filter((item) => item.section === section);

        if (sectionItems.length > 0) {
            groups.push({ items: sectionItems, label: SHOPPING_SECTION_LABELS[section], section });
        }
    }

    return groups;
}
