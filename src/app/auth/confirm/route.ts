import { createClient } from '@/lib/supabaseServerClient';
import type { EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';

// Landing point for the link in Supabase's "Reset Password" email. Uses the
// token_hash + verifyOtp flow rather than PKCE code exchange, deliberately:
// PKCE would require the code verifier cookie from the browser that
// requested the reset, which isn't there when the user opens the email link
// on a different device/browser. token_hash has no such device binding.
//
// requestPasswordReset (api/auth.ts) passes redirectTo explicitly as
// `${origin}/auth/confirm`, so this route works correctly whether the
// request came from localhost, the Vercel prod domain, or a preview
// deployment. For that to take effect, the Supabase project's "Reset
// Password" email template must build its action link from
// {{ .RedirectTo }}, NOT {{ .SiteURL }}:
//   {{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery
// And every origin in use (localhost:3000, the prod Vercel URL, and any
// preview URL pattern) must be added to Authentication > URL Configuration >
// Redirect URLs in the Supabase dashboard -- otherwise Supabase rejects the
// custom redirectTo and silently falls back to Site URL.
export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type') as EmailOtpType | null;

    if (tokenHash && type) {
        const supabase = await createClient();

        const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

        if (!error) {
            return NextResponse.redirect(`${origin}/reset-password`);
        }
    }

    return NextResponse.redirect(`${origin}/forgot-password?error=invalid-link`);
}
