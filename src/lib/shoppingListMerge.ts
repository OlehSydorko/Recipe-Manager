import { formatQuantity, parseQuantity } from '@/lib/quantity';
import type { ShoppingListItem, ShoppingSection } from '@/types/shoppingListItem';

export type NewShoppingListItemInput = {
    name: string;
    quantity: string;
    unit: string;
    section: ShoppingSection;
    sourceRecipeId: string | null;
};

export type ShoppingListItemUpdate = {
    id: string;
    quantity: string;
    is_checked: false;
};

export type ShoppingListAdditionsPlan = {
    toInsert: NewShoppingListItemInput[];
    toUpdate: ShoppingListItemUpdate[];
};

type MergeGroup =
    | { kind: 'existing'; id: string; quantity: string }
    | { kind: 'new'; input: NewShoppingListItemInput; quantity: string };

function normalizeKey(name: string, unit: string | null): string {
    return `${name.trim().toLowerCase()}|${(unit ?? '').trim().toLowerCase()}`;
}

function sumQuantities(existing: string | null, incoming: string): string | null {
    const existingValue = parseQuantity(existing);
    const incomingValue = parseQuantity(incoming);

    if (existingValue === null || incomingValue === null) {
        return null;
    }

    return formatQuantity(existingValue + incomingValue);
}

/**
 * Decides how a batch of ingoing shopping-list items should land: merged into an existing row
 * (summed quantity, un-checked), merged with each other when the same name+unit appears more than
 * once in one batch (e.g. two recipes added at once that both need onions), or inserted as a new,
 * separate row when there's nothing safe to merge into (different unit, or a quantity that isn't a
 * plain number/fraction).
 */
export function planShoppingListAdditions(
    existingItems: ShoppingListItem[],
    incomingItems: NewShoppingListItemInput[]
): ShoppingListAdditionsPlan {
    const existingByKey = new Map<string, ShoppingListItem>();

    for (const item of existingItems) {
        const key = normalizeKey(item.name, item.unit);

        if (!existingByKey.has(key)) {
            existingByKey.set(key, item);
        }
    }

    const groupsByKey = new Map<string, MergeGroup>();
    const standaloneInserts: NewShoppingListItemInput[] = [];

    for (const incoming of incomingItems) {
        const key = normalizeKey(incoming.name, incoming.unit || null);
        const group = groupsByKey.get(key);

        if (group) {
            const merged = sumQuantities(group.quantity, incoming.quantity);

            if (merged === null) {
                standaloneInserts.push(incoming);
                continue;
            }

            group.quantity = merged;
            continue;
        }

        const existingMatch = existingByKey.get(key);

        if (existingMatch) {
            const merged = sumQuantities(existingMatch.quantity, incoming.quantity);

            if (merged === null) {
                standaloneInserts.push(incoming);
                continue;
            }

            groupsByKey.set(key, { id: existingMatch.id, kind: 'existing', quantity: merged });
            continue;
        }

        groupsByKey.set(key, { input: incoming, kind: 'new', quantity: incoming.quantity });
    }

    const toUpdate: ShoppingListItemUpdate[] = [];
    const toInsert: NewShoppingListItemInput[] = [...standaloneInserts];

    for (const group of groupsByKey.values()) {
        if (group.kind === 'existing') {
            toUpdate.push({ id: group.id, is_checked: false, quantity: group.quantity });
        } else {
            toInsert.push({ ...group.input, quantity: group.quantity });
        }
    }

    return { toInsert, toUpdate };
}
