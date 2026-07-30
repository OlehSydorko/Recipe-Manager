import { createClient } from '@/lib/supabaseServerClient';

export default async function HomePage() {
    const supabase = await createClient();
    const {
        data: { user }
    } = await supabase.auth.getUser();

    return (
        <div>
            <h1 className='text-display font-semibold text-text-primary'>
                Welcome{user?.email ? `, ${user.email}` : ''}
            </h1>
            <p className='mt-2 text-body text-text-secondary'>You&apos;re logged in. Recipes go here next.</p>
        </div>
    );
}
