import { createClient } from '@/lib/supabaseClient';

export async function signUp(email: string, password: string, displayName: string) {
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                display_name: displayName
            }
        }
    });

    if (error) {
        throw error;
    }

    return data;
}

export async function signIn(email: string, password: string) {
    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        throw error;
    }

    return data;
}

export async function signOut() {
    const supabase = createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
        throw error;
    }
}

export async function requestPasswordReset(email: string) {
    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/confirm`
    });

    if (error) {
        throw error;
    }
}

export async function updatePassword(newPassword: string) {
    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
        throw error;
    }
}
