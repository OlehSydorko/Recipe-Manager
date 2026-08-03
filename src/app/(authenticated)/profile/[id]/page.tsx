'use client';

import { use, useEffect } from 'react';
import { FollowButton } from '@/components/FollowButton';
import { useFollowCounts } from '@/hooks/useFollows';
import { useAvatarUrl, useCurrentProfile, useProfile } from '@/hooks/useProfile';
import { MapPin, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

type UserProfilePageProps = {
    params: Promise<{ id: string }>;
};

// Read-only view of another user's profile. Recipes stay private per the
// existing RLS model — following someone grants no visibility into their
// recipes, so this page only ever shows public profile fields + follow
// counts + a follow/unfollow action, never a recipe grid.
export default function UserProfilePage({ params }: UserProfilePageProps) {
    const { id } = use(params);
    const router = useRouter();
    const { data: currentProfile } = useCurrentProfile();
    const { data: profile, isPending, isError } = useProfile(id);
    const { data: avatarUrl } = useAvatarUrl(profile?.avatar_url);
    const { data: followCounts } = useFollowCounts(id);

    // Visiting your own id here redirects to the editable /profile page instead.
    useEffect(() => {
        if (currentProfile && currentProfile.id === id) {
            router.replace('/profile');
        }
    }, [currentProfile, id, router]);

    if (isPending) {
        return <p className='text-body text-text-secondary'>Loading…</p>;
    }

    if (isError || !profile) {
        return <p className='text-body text-error'>Profile not found.</p>;
    }

    return (
        <div>
            <div className='flex flex-col gap-5 sm:flex-row sm:items-start'>
                <div className='flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-bg-secondary'>
                    {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={avatarUrl}
                            alt={profile.display_name ?? 'Profile photo'}
                            className='h-full w-full object-cover'
                        />
                    ) : (
                        <User size={28} className='text-text-disabled' />
                    )}
                </div>

                <div className='min-w-0 flex-1'>
                    <h1 className='text-display font-semibold text-text-primary'>
                        {profile.display_name || 'Unnamed'}
                    </h1>

                    {profile.tagline && <p className='mt-0.5 text-body text-text-secondary'>{profile.tagline}</p>}

                    {profile.location && (
                        <p className='mt-1.5 flex items-center gap-1 text-caption text-text-secondary'>
                            <MapPin size={14} />
                            {profile.location}
                        </p>
                    )}

                    {profile.bio && <p className='mt-3 max-w-xl text-body text-text-secondary'>{profile.bio}</p>}

                    <div className='mt-4'>
                        <FollowButton userId={profile.id} />
                    </div>
                </div>
            </div>

            <div className='mt-6 grid grid-cols-2 gap-3 sm:w-64'>
                <div className='rounded-lg border border-border bg-surface p-4 text-center'>
                    <p className='text-h2 font-semibold text-text-primary'>{followCounts?.followers ?? 0}</p>
                    <p className='text-caption text-text-secondary'>Followers</p>
                </div>
                <div className='rounded-lg border border-border bg-surface p-4 text-center'>
                    <p className='text-h2 font-semibold text-text-primary'>{followCounts?.following ?? 0}</p>
                    <p className='text-caption text-text-secondary'>Following</p>
                </div>
            </div>

            <p className='mt-8 text-caption text-text-disabled'>
                Recipes are private to their owner, so they aren&apos;t shown here.
            </p>
        </div>
    );
}
