import { type CookieOptions, createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

type CookieToSet = {
    name: string;
    value: string;
    options: CookieOptions;
};

// Guest access: browsing (home, recipes, recipe detail, discover, profiles,
// collections) is public. Only page-level create/edit surfaces and the
// user's own editable profile require a session — everything else is either
// public by nature or gated action-by-action in the UI (see useRequireAuth),
// not at the route level. See GUEST_ACCESS_PLAN.md for the full rationale.
const EXACT_PROTECTED_PATHS = ['/profile', '/recipes/new'];
const PROTECTED_PATH_PATTERNS = [/^\/recipes\/[^/]+\/edit$/];

// Message code carried to /login so it can show a friendly, path-specific
// reason for the redirect instead of a bare login form. Copy lives in
// src/app/login/page.tsx (and src/app/signup/page.tsx) keyed by these codes.
const EXACT_PATH_MESSAGE_CODES: Record<string, string> = {
    '/profile': 'profile',
    '/recipes/new': 'recipe-new'
};

function isProtectedRoute(pathname: string): boolean {
    return EXACT_PROTECTED_PATHS.includes(pathname) || PROTECTED_PATH_PATTERNS.some((pattern) => pattern.test(pathname));
}

function getRedirectMessageCode(pathname: string): string {
    if (EXACT_PATH_MESSAGE_CODES[pathname]) {
        return EXACT_PATH_MESSAGE_CODES[pathname];
    }

    if (PROTECTED_PATH_PATTERNS.some((pattern) => pattern.test(pathname))) {
        return 'recipe-edit';
    }

    return 'default';
}

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
                setAll(cookiesToSet: CookieToSet[]) {
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

    const authPaths = ['/login', '/signup'];
    const isAuthPath = authPaths.includes(request.nextUrl.pathname);
    const isProtectedPath = isProtectedRoute(request.nextUrl.pathname);

    if (!user && isProtectedPath) {
        const url = request.nextUrl.clone();

        url.pathname = '/login';
        url.searchParams.set('redirect', request.nextUrl.pathname);
        url.searchParams.set('message', getRedirectMessageCode(request.nextUrl.pathname));

        return NextResponse.redirect(url);
    }

    if (user && isAuthPath) {
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
