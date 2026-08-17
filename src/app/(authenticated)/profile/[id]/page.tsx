import { createClient } from '@/lib/supabaseServerClient';
import type { Metadata } from 'next';
import { ProfileDetailClient } from './ProfileDetailClient';

type UserProfilePageProps = {
    params: Promise<{ id: string }>;
};

const SITE_NAME = 'Recipe Manager';

// Public profiles are guest-viewable now (see GUEST_ACCESS_PLAN.md), so this
// page gets a thin Server Component wrapper for metadata, same pattern as
// the recipe detail page -- the profile body itself stays a client component
// (follow state, tab-free recipe/collection lists) with no server-render
// equivalent worth building out here.
export async function generateMetadata({ params }: UserProfilePageProps): Promise<Metadata> {
    const { id } = await params;
    const supabase = await createClient();

    const { data: profile } = await supabase.from('profiles').select('display_name, bio').eq('id', id).maybeSingle();

    if (!profile) {
        return { title: `Profile not found | ${SITE_NAME}` };
    }

    const name = profile.display_name || 'Unnamed cook';

    return {
        title: `${name} | ${SITE_NAME}`,
        description: profile.bio || `${name}'s recipes on ${SITE_NAME}.`
    };
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
    const { id } = await params;

    return <ProfileDetailClient id={id} />;
}
