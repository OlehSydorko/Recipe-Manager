import { createClient } from '@/lib/supabaseClient';
import { type Category, DEFAULT_CATEGORY_COUNT } from '@/types/category';

const NOT_AUTHENTICATED_MESSAGE = 'Not authenticated';

export async function getCategories(): Promise<Category[]> {
    const supabase = createClient();

    const {
        data: { session }
    } = await supabase.auth.getSession();
    const user = session?.user ?? null;

    if (!user) {
        throw new Error(NOT_AUTHENTICATED_MESSAGE);
    }

    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

    if (error) {
        throw error;
    }

    return data;
}

export async function createCategory(name: string): Promise<Category> {
    const supabase = createClient();

    const {
        data: { session }
    } = await supabase.auth.getSession();
    const user = session?.user ?? null;

    if (!user) {
        throw new Error(NOT_AUTHENTICATED_MESSAGE);
    }

    const { data, error } = await supabase.from('categories').insert({ name, user_id: user.id }).select().single();

    if (error) {
        throw error;
    }

    return data;
}

export async function deleteCategory(id: string): Promise<void> {
    const supabase = createClient();

    const {
        data: { session }
    } = await supabase.auth.getSession();
    const user = session?.user ?? null;

    if (!user) {
        throw new Error(NOT_AUTHENTICATED_MESSAGE);
    }

    const { data: defaultCategories, error: defaultsError } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(DEFAULT_CATEGORY_COUNT);

    if (defaultsError) {
        throw defaultsError;
    }

    if (defaultCategories.some((defaultCategory) => defaultCategory.id === id)) {
        throw new Error('Default categories cannot be deleted.');
    }

    const { count, error: countError } = await supabase
        .from('recipes')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', id);

    if (countError) {
        throw countError;
    }

    if (count) {
        throw new Error('This category still has recipes in it. Move or delete them first.');
    }

    const { error } = await supabase.from('categories').delete().eq('id', id);

    if (error) {
        throw error;
    }
}
