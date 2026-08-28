'use client';

import type { ReactNode } from 'react';
import { useAvatarUrl } from '@/hooks/useProfile';
import type { Profile } from '@/types/profile';
import { User } from 'lucide-react';
import Link from 'next/link';

type ProfileListItemProps = {
    profile: Profile;
    action?: ReactNode;
};

export function ProfileListItem({ profile, action }: ProfileListItemProps) {
    const { data: avatarUrl } = useAvatarUrl(profile.avatar_url);

    return (
        <div className='flex items-center gap-3 py-2'>
            <Link href={`/profile/${profile.id}`} className='flex min-w-0 flex-1 items-center gap-3'>
                <div className='flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-bg-secondary'>
                    {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={avatarUrl}
                            alt={profile.display_name ?? 'Profile photo'}
                            className='h-full w-full object-cover'
                        />
                    ) : (
                        <User size={16} className='text-text-disabled' />
                    )}
                </div>

                <div className='min-w-0'>
                    <p className='truncate text-body font-medium text-text-primary'>
                        {profile.display_name || 'Unnamed'}
                    </p>
                    {profile.tagline && <p className='truncate text-caption text-text-secondary'>{profile.tagline}</p>}
                </div>
            </Link>

            {action}
        </div>
    );
}
