'use client';

import { Button } from '@/components/ui/Button';
import { useFollowUser, useIsFollowing, useUnfollowUser } from '@/hooks/useFollows';

type FollowButtonProps = {
    userId: string;
};

export function FollowButton({ userId }: FollowButtonProps) {
    const { data: isFollowing, isPending } = useIsFollowing(userId);
    const followUser = useFollowUser();
    const unfollowUser = useUnfollowUser();

    const isMutating = followUser.isPending || unfollowUser.isPending;

    const handleClick = () => {
        if (isFollowing) {
            unfollowUser.mutate(userId);
        } else {
            followUser.mutate(userId);
        }
    };

    return (
        <Button
            variant={isFollowing ? 'secondary' : 'primary'}
            onClick={handleClick}
            disabled={isPending || isMutating}
        >
            {isFollowing ? 'Following' : 'Follow'}
        </Button>
    );
}
