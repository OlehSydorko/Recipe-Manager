import { createClient } from '@/lib/supabaseServerClient';

export default async function HomePage() {
    const supabase = await createClient();
    const {
        data: { user }
    } = await supabase.auth.getUser();

    return (
        <div>
            <h1 className='text-2xl font-semibold'>Welcome{user?.email ? `, ${user.email}` : ''}</h1>
            <p className='mt-2 text-sm text-gray-600'>You&apos;re logged in. Recipes go here next.</p>
        </div>
    );
}
