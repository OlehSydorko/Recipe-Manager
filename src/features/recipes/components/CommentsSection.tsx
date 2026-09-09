'use client';

import { TextLineSkeleton } from '@/components/ui/Skeleton';
import { CommentCard } from '@/features/recipes/components/CommentCard/CommentCard';
import { CommentComposer } from '@/features/recipes/components/CommentComposer';
import { useRecipeComments } from '@/hooks/useComments';
import { buildCommentTree } from '@/lib/commentTree';

type CommentsSectionProps = {
    recipeId: string;
    isOwner: boolean;
};

export function CommentsSection({ recipeId, isOwner }: CommentsSectionProps) {
    const { data: comments, isPending } = useRecipeComments(recipeId);
    const tree = buildCommentTree(comments ?? []);

    return (
        <div className='mt-6 rounded-lg border border-border bg-surface p-5'>
            <h2 className='text-h2 font-semibold text-text-primary'>Ratings & Reviews</h2>

            <div className='mt-3'>
                <CommentComposer recipeId={recipeId} />
            </div>

            {isPending && (
                <div className='mt-4 space-y-3'>
                    <TextLineSkeleton className='w-2/3' />
                    <TextLineSkeleton className='w-1/2' />
                </div>
            )}

            {!isPending && tree.length === 0 && (
                <p className='mt-4 text-body text-text-secondary'>No reviews yet. Be the first to rate this recipe.</p>
            )}

            {!isPending && tree.length > 0 && (
                <div className='mt-2 divide-y divide-border'>
                    {tree.map((comment) => (
                        <CommentCard key={comment.id} comment={comment} recipeId={recipeId} isRecipeOwner={isOwner} />
                    ))}
                </div>
            )}
        </div>
    );
}
