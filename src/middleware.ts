import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    supabaseResponse = NextResponse.next({
                        request
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                }
            }
        }
    );

    // Do not add logic between createServerClient and getUser() — getUser() re-validates
    // the token against Supabase Auth itself (unlike getSession(), which just trusts the
    // cookie). Skipping this, or reordering it, is a common way to accidentally let stale
    // or forged sessions through.
    const {
        data: { user }
    } = await supabase.auth.getUser();

    const publicPaths = ['/login', '/signup'];
    const isPublicPath = publicPaths.includes(request.nextUrl.pathname);

    if (!user && !isPublicPath) {
        const url = request.nextUrl.clone();

        url.pathname = '/login';
        
return NextResponse.redirect(url);
    }

    if (user && isPublicPath) {
        const url = request.nextUrl.clone();

        url.pathname = '/';
        
return NextResponse.redirect(url);
    }

    return supabaseResponse;
}

export async function middleware(request: NextRequest) {
    return updateSession(request);
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
};
