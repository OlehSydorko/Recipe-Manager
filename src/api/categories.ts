import { createClient } from '@/lib/supabaseClient';
import type { Category } from '@/types/category';

export async function getCategories(): Promise<Category[]> {
    const supabase = createClient();

    const { data, error } = await supabase.from('categories').select('*').order('created_at', { ascending: true });

    if (error) {
        throw error;
    }

    return data;
}

export async function createCategory(name: string): Promise<Category> {
    const supabase = createClient();

    const {
        data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Not authenticated');
    }

    const { data, error } = await supabase
        .from('categories')
        .insert({ name, user_id: user.id })
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

export async function deleteCategory(id: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase.from('categories').delete().eq('id', id);

    if (error) {
        throw error;
    }
}
