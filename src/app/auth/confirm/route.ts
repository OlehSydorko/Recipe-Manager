import { createClient } from '@/lib/supabaseServerClient';
import type { EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';

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
