'use client';

import { Button } from '@/components/ui/Button';
import { useFollowUser, useIsFollowing, useUnfollowUser } from '@/hooks/useFollows';
import { useRequireAuth } from '@/hooks/useRequireAuth';

type FollowButtonProps = {
    userId: string;
};

export function FollowButton({ userId }: FollowButtonProps) {
    const { data: isFollowing, isPending } = useIsFollowing(userId);
    const followUser = useFollowUser();
    const unfollowUser = useUnfollowUser();
    const { requireAuth, authGate } = useRequireAuth('Sign in to follow other cooks.');

    const isMutating = followUser.isPending || unfollowUser.isPending;

    const handleClick = () => {
        requireAuth(() => {
            if (isFollowing) {
                unfollowUser.mutate(userId);
            } else {
                followUser.mutate(userId);
            }
        });
    };

    return (
        <>
            <Button
                variant={isFollowing ? 'secondary' : 'primary'}
                onClick={handleClick}
                disabled={isPending || isMutating}
            >
                {isFollowing ? 'Following' : 'Follow'}
            </Button>
            {authGate}
        </>
    );
}
