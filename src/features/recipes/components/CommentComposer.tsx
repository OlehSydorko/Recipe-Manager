'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { RatingStars } from '@/features/recipes/components/RatingStars';
import { useMyReview, useUpsertReview } from '@/hooks/useComments';
import { useRequireAuth } from '@/hooks/useRequireAuth';

type CommentComposerProps = {
    recipeId: string;
};

const INTERACTIVE_STAR_SIZE = 26;

export function CommentComposer({ recipeId }: CommentComposerProps) {
    const { data: myReview } = useMyReview(recipeId);
    const upsertReview = useUpsertReview();
    const { isGuest, requireAuth, authGate } = useRequireAuth('Sign in to rate this recipe.');

    const [rating, setRating] = useState(0);
    const [body, setBody] = useState('');

    useEffect(() => {
        setRating(myReview?.rating ?? 0);
        setBody(myReview?.body ?? '');
    }, [myReview]);

    const handleRate = (nextRating: number) => {
        requireAuth(() => setRating(nextRating));
    };

    const handleSubmit = () => {
        if (rating === 0) {
            return;
        }

        upsertReview.mutate({ body: body.trim() || null, rating, recipeId });
    };

    return (
        <div className='rounded-lg border border-border bg-surface p-4'>
            <span className='block text-label font-medium text-text-secondary'>
                {myReview ? 'Your rating' : 'Rate this recipe'}
            </span>

            <div className='mt-2'>
                <RatingStars value={rating} onChange={handleRate} size={INTERACTIVE_STAR_SIZE} />
            </div>

            {rating > 0 && !isGuest && (
                <>
                    <Textarea
                        value={body}
                        onChange={(event) => setBody(event.target.value)}
                        placeholder='Share what you thought (optional)'
                        rows={3}
                        className='mt-3'
                    />

                    <Button variant='primary' onClick={handleSubmit} disabled={upsertReview.isPending} className='mt-3'>
                        {upsertReview.isPending ? 'Posting…' : myReview ? 'Update your review' : 'Post'}
                    </Button>
                </>
            )}

            {authGate}
        </div>
    );
}
