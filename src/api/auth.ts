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

// Deliberately does not surface whether the email is registered -- Supabase
// already returns success either way for this call, and callers must not add
// their own existence check on top (see forgot-password/page.tsx).
export async function requestPasswordReset(email: string) {
    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
        throw error;
    }
}

// Only succeeds when called with an active session -- for the recovery flow
// that session comes from /auth/confirm having just verified the emailed
// token, not from a normal sign-in.
export async function updatePassword(newPassword: string) {
    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
        throw error;
    }
}
