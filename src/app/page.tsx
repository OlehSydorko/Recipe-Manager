import { createClient } from '@/lib/supabaseServerClient';
import { SignOutButton } from '@/components/SignOutButton';

export default async function HomePage() {
    const supabase = await createClient();
    const {
        data: { user }
    } = await supabase.auth.getUser();

    return (
        <main className='flex min-h-screen flex-col items-center justify-center gap-4 px-4'>
            <h1 className='text-2xl font-semibold'>Welcome{user?.email ? `, ${user.email}` : ''}</h1>
            <p className='text-sm text-gray-600'>You&apos;re logged in. Recipes go here next.</p>
            <SignOutButton />
        </main>
    );
}
