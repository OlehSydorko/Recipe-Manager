import { type NewShoppingListItemInput, planShoppingListAdditions } from '@/lib/shoppingListMerge';
import { createClient } from '@/lib/supabaseClient';
import type { ShoppingListItem, ShoppingSection } from '@/types/shoppingListItem';

const NOT_AUTHENTICATED_MESSAGE = 'Not authenticated';

async function getCurrentUserId(): Promise<string> {
    const supabase = createClient();

    const {
        data: { session }
    } = await supabase.auth.getSession();
    const user = session?.user ?? null;

    if (!user) {
        throw new Error(NOT_AUTHENTICATED_MESSAGE);
    }

    return user.id;
}

export async function getShoppingListItems(): Promise<ShoppingListItem[]> {
    const supabase = createClient();

    const {
        data: { session }
    } = await supabase.auth.getSession();
    const user = session?.user ?? null;

    if (!user) {
        return [];
    }

    const { data, error } = await supabase
        .from('shopping_list_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

    if (error) {
        throw error;
    }

    return data;
}

export type AddShoppingListItemsInput = {
    name: string;
    quantity: string;
    unit: string;
    section: ShoppingSection;
    sourceRecipeId?: string | null;
};

export async function addShoppingListItems(inputs: AddShoppingListItemsInput[]): Promise<void> {
    if (inputs.length === 0) {
        return;
    }

    const supabase = createClient();
    const userId = await getCurrentUserId();

    const existingItems = await getShoppingListItems();

    const incomingItems: NewShoppingListItemInput[] = inputs.map((input) => ({
        name: input.name.trim(),
        quantity: input.quantity.trim(),
        section: input.section,
        sourceRecipeId: input.sourceRecipeId ?? null,
        unit: input.unit.trim()
    }));

    const { toInsert, toUpdate } = planShoppingListAdditions(existingItems, incomingItems);

    if (toInsert.length > 0) {
        const rows = toInsert.map((item) => ({
            name: item.name,
            quantity: item.quantity || null,
            section: item.section,
            source_recipe_id: item.sourceRecipeId,
            unit: item.unit || null,
            user_id: userId
        }));

        const { error } = await supabase.from('shopping_list_items').insert(rows);

        if (error) {
            throw error;
        }
    }

    for (const update of toUpdate) {
        const { error } = await supabase
            .from('shopping_list_items')
            .update({ is_checked: update.is_checked, quantity: update.quantity })
            .eq('id', update.id);

        if (error) {
            throw error;
        }
    }
}

export type UpdateShoppingListItemInput = {
    id: string;
    name: string;
    quantity: string;
    unit: string;
    section: ShoppingSection;
};

export async function updateShoppingListItem(input: UpdateShoppingListItemInput): Promise<ShoppingListItem> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('shopping_list_items')
        .update({
            name: input.name.trim(),
            quantity: input.quantity.trim() || null,
            section: input.section,
            unit: input.unit.trim() || null
        })
        .eq('id', input.id)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

export async function setShoppingListItemChecked(id: string, isChecked: boolean): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase.from('shopping_list_items').update({ is_checked: isChecked }).eq('id', id);

    if (error) {
        throw error;
    }
}

export async function deleteShoppingListItem(id: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase.from('shopping_list_items').delete().eq('id', id);

    if (error) {
        throw error;
    }
}

export async function clearCheckedShoppingListItems(): Promise<void> {
    const supabase = createClient();
    const userId = await getCurrentUserId();

    const { error } = await supabase.from('shopping_list_items').delete().eq('user_id', userId).eq('is_checked', true);

    if (error) {
        throw error;
    }
}
