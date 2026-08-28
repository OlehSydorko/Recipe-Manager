import { type CookieOptions, createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

type CookieToSet = {
    name: string;
    value: string;
    options: CookieOptions;
};

const EXACT_PROTECTED_PATHS = ['/profile', '/recipes/new'];
const PROTECTED_PATH_PATTERNS = [/^\/recipes\/[^/]+\/edit$/];

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

    const {
        data: { user }
    } = await supabase.auth.getUser();

    const authPaths = ['/login', '/signup'];
    const isAuthPath = authPaths.includes(request.nextUrl.pathname);
    const isProtectedPath = isProtectedRoute(request.nextUrl.pathname);

    if (!user && request.nextUrl.pathname === '/reset-password') {
        const url = request.nextUrl.clone();

        url.pathname = '/forgot-password';

        return NextResponse.redirect(url);
    }

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
