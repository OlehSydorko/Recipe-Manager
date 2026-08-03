'use client';

import { useAvatarUrl } from '@/hooks/useProfile';
import type { Profile } from '@/types/profile';
import { MapPin, Pencil, User } from 'lucide-react';

type ProfileHeaderProps = {
    profile: Profile;
    onEdit: () => void;
};

export function ProfileHeader({ profile, onEdit }: ProfileHeaderProps) {
    const { data: avatarUrl } = useAvatarUrl(profile.avatar_url);

    return (
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
                <h1 className='text-display font-semibold text-text-primary'>{profile.display_name || 'Unnamed'}</h1>

                {profile.tagline && <p className='mt-0.5 text-body text-text-secondary'>{profile.tagline}</p>}

                {profile.location && (
                    <p className='mt-1.5 flex items-center gap-1 text-caption text-text-secondary'>
                        <MapPin size={14} />
                        {profile.location}
                    </p>
                )}

                {profile.bio && <p className='mt-3 max-w-xl text-body text-text-secondary'>{profile.bio}</p>}

                <button
                    type='button'
                    onClick={onEdit}
                    className='mt-4 inline-flex items-center gap-2 rounded-md border border-border-strong px-4 py-2.5 text-button font-medium text-text-primary transition-colors duration-150 hover:bg-hover'
                >
                    <Pencil size={14} />
                    Edit profile
                </button>
            </div>
        </div>
    );
}
