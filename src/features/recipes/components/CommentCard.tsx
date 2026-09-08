'use client';

import { useState } from 'react';
import { ActionMenu, type ActionMenuItem } from '@/components/ui/ActionMenu';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { RatingStars } from '@/features/recipes/components/RatingStars';
import { useAddReply, useDeleteComment, useToggleCommentLike, useUpdateComment } from '@/hooks/useComments';
import { useAvatarUrl, useCurrentProfile } from '@/hooks/useProfile';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { formatCommentTime } from '@/lib/relativeTime';
import type { CommentNode } from '@/types/comment';
import { Heart } from 'lucide-react';
import Link from 'next/link';

type CommentCardProps = {
    comment: CommentNode;
    recipeId: string;
    isRecipeOwner: boolean;
    depth?: number;
};
const INDENT_CLASSES = ['', 'ml-4', 'ml-8', 'ml-11', 'ml-11', 'ml-11'];
const MAX_VISUAL_DEPTH = INDENT_CLASSES.length - 1;

export function CommentCard({ comment, recipeId, isRecipeOwner, depth = 0 }: CommentCardProps) {
    const { data: currentProfile } = useCurrentProfile();
    const { data: avatarUrl } = useAvatarUrl(comment.author.avatarUrl);
    const { requireAuth, authGate } = useRequireAuth('Sign in to join the conversation.');
    const toggleLike = useToggleCommentLike();
    const addReply = useAddReply();
    const updateComment = useUpdateComment();
    const deleteComment = useDeleteComment();

    const [isReplying, setIsReplying] = useState(false);
    const [replyBody, setReplyBody] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editBody, setEditBody] = useState(comment.body ?? '');

    const isAuthor = currentProfile?.id === comment.user_id;
    const canDelete = isAuthor || isRecipeOwner;
    const indentClass = INDENT_CLASSES[Math.min(depth, MAX_VISUAL_DEPTH)];

    const handleToggleLike = () => {
        requireAuth(() => toggleLike.mutate({ commentId: comment.id, isLiked: !comment.likedByMe, recipeId }));
    };

    const handleReplyClick = () => {
        requireAuth(() => setIsReplying(true));
    };

    const handleSubmitReply = () => {
        if (!replyBody.trim()) {
            return;
        }

        addReply.mutate(
            { body: replyBody.trim(), parentId: comment.id, recipeId },
            {
                onSuccess: () => {
                    setReplyBody('');
                    setIsReplying(false);
                }
            }
        );
    };

    const handleSubmitEdit = () => {
        if (!editBody.trim()) {
            return;
        }

        updateComment.mutate(
            { body: editBody.trim(), id: comment.id, recipeId },
            { onSuccess: () => setIsEditing(false) }
        );
    };

    const handleDelete = () => {
        deleteComment.mutate({ id: comment.id, recipeId });
    };

    const menuItems: ActionMenuItem[] = [
        ...(isAuthor ? [{ label: 'Edit', onSelect: () => setIsEditing(true) }] : []),
        { label: 'Delete', onSelect: handleDelete, variant: 'danger' as const }
    ];

    return (
        <div className={indentClass}>
            <div className='flex gap-3 py-3'>
                <Link href={`/profile/${comment.author.id}`} className='shrink-0'>
                    <Avatar src={avatarUrl} name={comment.author.displayName} sizeClassName='h-9 w-9' />
                </Link>

                <div className='min-w-0 flex-1'>
                    <div className='flex items-start justify-between gap-2'>
                        <div>
                            <Link
                                href={`/profile/${comment.author.id}`}
                                className='text-button font-medium text-text-primary hover:text-accent'
                            >
                                {comment.author.displayName ?? 'Someone'}
                            </Link>
                            <span
                                className='ml-2 text-label text-text-disabled'
                                title={new Date(comment.created_at).toLocaleString()}
                            >
                                {formatCommentTime(comment.created_at)}
                            </span>
                        </div>

                        {canDelete && (
                            <ActionMenu
                                ariaLabel={`Actions for ${comment.author.displayName ?? 'this'}'s comment`}
                                items={menuItems}
                            />
                        )}
                    </div>

                    {comment.rating !== null && (
                        <div className='mt-1'>
                            <RatingStars value={comment.rating} size={14} />
                        </div>
                    )}

                    {isEditing ? (
                        <div className='mt-2'>
                            <Textarea value={editBody} onChange={(event) => setEditBody(event.target.value)} rows={2} />
                            <div className='mt-2 flex gap-2'>
                                <Button variant='primary' onClick={handleSubmitEdit} disabled={updateComment.isPending}>
                                    Save
                                </Button>
                                <Button variant='ghost' onClick={() => setIsEditing(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        comment.body && <p className='mt-1 text-body text-text-secondary'>{comment.body}</p>
                    )}

                    <div className='mt-1.5 flex items-center gap-3'>
                        <button
                            type='button'
                            onClick={handleToggleLike}
                            aria-pressed={comment.likedByMe}
                            className='inline-flex items-center gap-1 text-label text-text-secondary transition-colors duration-150 hover:text-accent'
                        >
                            <Heart size={14} className={comment.likedByMe ? 'fill-accent text-accent' : ''} />
                            {comment.likeCount > 0 && comment.likeCount}
                        </button>

                        <button
                            type='button'
                            onClick={handleReplyClick}
                            className='text-label text-text-secondary transition-colors duration-150 hover:text-accent'
                        >
                            Reply
                        </button>
                    </div>

                    {isReplying && (
                        <div className='mt-2'>
                            <Textarea
                                value={replyBody}
                                onChange={(event) => setReplyBody(event.target.value)}
                                placeholder='Write a reply'
                                rows={2}
                            />
                            <div className='mt-2 flex gap-2'>
                                <Button variant='primary' onClick={handleSubmitReply} disabled={addReply.isPending}>
                                    {addReply.isPending ? 'Posting…' : 'Post reply'}
                                </Button>
                                <Button variant='ghost' onClick={() => setIsReplying(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}

                    {comment.replies.length > 0 && (
                        <div className='mt-2 border-l border-border pl-3'>
                            {comment.replies.map((reply) => (
                                <CommentCard
                                    key={reply.id}
                                    comment={reply}
                                    recipeId={recipeId}
                                    isRecipeOwner={isRecipeOwner}
                                    depth={depth + 1}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {authGate}
        </div>
    );
}
