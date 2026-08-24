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
//
// redirectTo is set explicitly to the *current* origin (localhost in dev,
// whichever Vercel URL the request came from in prod/preview) so the emailed
// link lands back on the same environment that requested it, instead of
// always going to whatever "Site URL" happens to be configured in the
// Supabase dashboard. This requires the Supabase "Reset Password" email
// template to reference {{ .RedirectTo }} (not {{ .SiteURL }}) -- see
// app/auth/confirm/route.ts -- and every origin used (localhost + prod +
// any preview URLs) to be added to the project's Redirect URLs allow list,
// or Supabase silently falls back to Site URL.
export async function requestPasswordReset(email: string) {
    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/confirm`
    });

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
