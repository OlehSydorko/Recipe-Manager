'use client';

import { Modal } from '@/components/ui/Modal';
import { ProfileListItem } from '@/features/profile/components/ProfileListItem';
import { FollowButton } from '@/features/social/components/FollowButton';
import { useFollowers, useFollowing } from '@/hooks/useFollows';

type FollowListMode = 'followers' | 'following';

type FollowListModalProps = {
    userId: string | null;
    mode: FollowListMode;
    onClose: () => void;
};

// Reuses FollowButton for every row in both modes — it reflects the real
// relationship regardless of which list it's rendered in, so a follower who
// isn't followed back shows "Follow", and someone already followed shows
// "Following" either way.
export function FollowListModal({ userId, mode, onClose }: FollowListModalProps) {
    const { data: followers, isPending: followersPending } = useFollowers(mode === 'followers' ? userId : null);
    const { data: following, isPending: followingPending } = useFollowing(mode === 'following' ? userId : null);

    const profiles = mode === 'followers' ? followers : following;
    const isPending = mode === 'followers' ? followersPending : followingPending;
    const title = mode === 'followers' ? 'Followers' : 'Following';

    return (
        <Modal open={Boolean(userId)} onClose={onClose} title={title}>
            {isPending && <p className='text-body text-text-secondary'>Loading…</p>}

            {!isPending && profiles?.length === 0 && (
                <p className='text-body text-text-secondary'>
                    {mode === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
                </p>
            )}

            {!isPending && profiles && profiles.length > 0 && (
                <div className='max-h-80 divide-y divide-border overflow-y-auto'>
                    {profiles.map((profile) => (
                        <ProfileListItem
                            key={profile.id}
                            profile={profile}
                            action={<FollowButton userId={profile.id} />}
                        />
                    ))}
                </div>
            )}
        </Modal>
    );
}
