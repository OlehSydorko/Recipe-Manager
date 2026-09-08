import { getProfilesByIds } from '@/api/profiles';
import { createClient } from '@/lib/supabaseClient';
import type { Comment, CommentAuthor, CommentWithMeta, RatingSummary } from '@/types/comment';

const NOT_AUTHENTICATED_MESSAGE = 'Not authenticated';

async function getCurrentUserId(): Promise<string | null> {
    const supabase = createClient();

    const {
        data: { session }
    } = await supabase.auth.getSession();

    return session?.user?.id ?? null;
}

export async function getRecipeComments(recipeId: string): Promise<CommentWithMeta[]> {
    const supabase = createClient();

    const [{ data: comments, error: commentsError }, currentUserId] = await Promise.all([
        supabase
            .from('recipe_comments')
            .select('*')
            .eq('recipe_id', recipeId)
            .order('created_at', { ascending: true }),
        getCurrentUserId()
    ]);

    if (commentsError) {
        throw commentsError;
    }

    const rows = comments as Comment[];

    if (rows.length === 0) {
        return [];
    }

    const commentIds = rows.map((row) => row.id);
    const authorIds = [...new Set(rows.map((row) => row.user_id))];

    const [{ data: likes, error: likesError }, authorProfiles] = await Promise.all([
        supabase.from('recipe_comment_likes').select('comment_id, user_id').in('comment_id', commentIds),
        getProfilesByIds(authorIds)
    ]);

    if (likesError) {
        throw likesError;
    }

    const likeCountByComment = new Map<string, number>();
    const likedByMeSet = new Set<string>();

    for (const like of likes ?? []) {
        likeCountByComment.set(like.comment_id, (likeCountByComment.get(like.comment_id) ?? 0) + 1);

        if (currentUserId && like.user_id === currentUserId) {
            likedByMeSet.add(like.comment_id);
        }
    }

    const authorsById = new Map<string, CommentAuthor>(
        authorProfiles.map((profile) => [
            profile.id,
            { avatarUrl: profile.avatar_url, displayName: profile.display_name, id: profile.id }
        ])
    );

    return rows.map((row) => ({
        ...row,
        author: authorsById.get(row.user_id) ?? { avatarUrl: null, displayName: null, id: row.user_id },
        likeCount: likeCountByComment.get(row.id) ?? 0,
        likedByMe: likedByMeSet.has(row.id)
    }));
}

export async function getMyReview(recipeId: string): Promise<Comment | null> {
    const supabase = createClient();
    const currentUserId = await getCurrentUserId();

    if (!currentUserId) {
        return null;
    }

    const { data, error } = await supabase
        .from('recipe_comments')
        .select('*')
        .eq('recipe_id', recipeId)
        .eq('user_id', currentUserId)
        .is('parent_id', null)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data;
}

export async function getRecipeRatingSummary(recipeId: string): Promise<RatingSummary> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('recipe_comments')
        .select('rating')
        .eq('recipe_id', recipeId)
        .is('parent_id', null);

    if (error) {
        throw error;
    }

    const ratings = (data ?? [])
        .map((row) => row.rating)
        .filter((rating): rating is number => rating !== null);

    if (ratings.length === 0) {
        return { averageRating: null, ratingCount: 0 };
    }

    const ROUNDING_FACTOR = 100;
    const sum = ratings.reduce((total, rating) => total + rating, 0);

    return {
        averageRating: Math.round((sum / ratings.length) * ROUNDING_FACTOR) / ROUNDING_FACTOR,
        ratingCount: ratings.length
    };
}

export type UpsertReviewInput = {
    recipeId: string;
    rating: number;
    body: string | null;
};

// Two-step update-then-insert rather than a single .upsert() call: the "one review
// per user per recipe" rule is a *partial* unique index (where parent_id is null),
// and targeting that reliably through supabase-js's onConflict option is not
// guaranteed across client versions, so this avoids the ambiguity entirely.
export async function upsertReview(input: UpsertReviewInput): Promise<Comment> {
    const supabase = createClient();
    const currentUserId = await getCurrentUserId();

    if (!currentUserId) {
        throw new Error(NOT_AUTHENTICATED_MESSAGE);
    }

    const { data: updated, error: updateError } = await supabase
        .from('recipe_comments')
        .update({ body: input.body, rating: input.rating, updated_at: new Date().toISOString() })
        .eq('recipe_id', input.recipeId)
        .eq('user_id', currentUserId)
        .is('parent_id', null)
        .select()
        .maybeSingle();

    if (updateError) {
        throw updateError;
    }

    if (updated) {
        return updated;
    }

    const { data: inserted, error: insertError } = await supabase
        .from('recipe_comments')
        .insert({
            body: input.body,
            rating: input.rating,
            recipe_id: input.recipeId,
            user_id: currentUserId
        })
        .select()
        .single();

    if (insertError) {
        throw insertError;
    }

    return inserted;
}

export type AddReplyInput = {
    recipeId: string;
    parentId: string;
    body: string;
};

export async function addReply(input: AddReplyInput): Promise<Comment> {
    const supabase = createClient();
    const currentUserId = await getCurrentUserId();

    if (!currentUserId) {
        throw new Error(NOT_AUTHENTICATED_MESSAGE);
    }

    const { data, error } = await supabase
        .from('recipe_comments')
        .insert({
            body: input.body,
            parent_id: input.parentId,
            recipe_id: input.recipeId,
            user_id: currentUserId
        })
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

export type UpdateCommentInput = {
    id: string;
    body: string;
};

export async function updateComment(input: UpdateCommentInput): Promise<Comment> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('recipe_comments')
        .update({ body: input.body, updated_at: new Date().toISOString() })
        .eq('id', input.id)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

export async function deleteComment(id: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase.from('recipe_comments').delete().eq('id', id);

    if (error) {
        throw error;
    }
}

export async function likeComment(commentId: string): Promise<void> {
    const supabase = createClient();
    const currentUserId = await getCurrentUserId();

    if (!currentUserId) {
        throw new Error(NOT_AUTHENTICATED_MESSAGE);
    }

    const { error } = await supabase
        .from('recipe_comment_likes')
        .insert({ comment_id: commentId, user_id: currentUserId });

    if (error) {
        throw error;
    }
}

export async function unlikeComment(commentId: string): Promise<void> {
    const supabase = createClient();
    const currentUserId = await getCurrentUserId();

    if (!currentUserId) {
        throw new Error(NOT_AUTHENTICATED_MESSAGE);
    }

    const { error } = await supabase
        .from('recipe_comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', currentUserId);

    if (error) {
        throw error;
    }
}
