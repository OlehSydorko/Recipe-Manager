import {
    type AddReplyInput,
    type UpdateCommentInput,
    type UpsertReviewInput,
    addReply,
    deleteComment,
    getMyReview,
    getRecipeComments,
    getRecipeRatingSummary,
    likeComment,
    unlikeComment,
    updateComment,
    upsertReview
} from '@/api/comments';
import type { CommentWithMeta } from '@/types/comment';
import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const commentsQueryKey = (recipeId: string) => ['recipes', recipeId, 'comments'];
const myReviewQueryKey = (recipeId: string) => ['recipes', recipeId, 'my-review'];
const ratingSummaryQueryKey = (recipeId: string) => ['recipes', recipeId, 'rating-summary'];

function invalidateRecipeCommentQueries(queryClient: QueryClient, recipeId: string) {
    queryClient.invalidateQueries({ queryKey: commentsQueryKey(recipeId) });
    queryClient.invalidateQueries({ queryKey: myReviewQueryKey(recipeId) });
    queryClient.invalidateQueries({ queryKey: ratingSummaryQueryKey(recipeId) });
}

export function useRecipeComments(recipeId: string) {
    return useQuery({
        enabled: Boolean(recipeId),
        queryFn: () => getRecipeComments(recipeId),
        queryKey: commentsQueryKey(recipeId)
    });
}

export function useMyReview(recipeId: string) {
    return useQuery({
        enabled: Boolean(recipeId),
        queryFn: () => getMyReview(recipeId),
        queryKey: myReviewQueryKey(recipeId)
    });
}

export function useRecipeRatingSummary(recipeId: string) {
    return useQuery({
        enabled: Boolean(recipeId),
        queryFn: () => getRecipeRatingSummary(recipeId),
        queryKey: ratingSummaryQueryKey(recipeId)
    });
}

export function useUpsertReview() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: UpsertReviewInput) => upsertReview(input),
        onSuccess: (_data, variables) => {
            invalidateRecipeCommentQueries(queryClient, variables.recipeId);
        }
    });
}

type AddReplyContextInput = AddReplyInput;

export function useAddReply() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: AddReplyContextInput) => addReply(input),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: commentsQueryKey(variables.recipeId) });
        }
    });
}

type UpdateCommentContextInput = UpdateCommentInput & { recipeId: string };

export function useUpdateComment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, body }: UpdateCommentContextInput) => updateComment({ body, id }),
        onSuccess: (_data, variables) => {
            invalidateRecipeCommentQueries(queryClient, variables.recipeId);
        }
    });
}

type DeleteCommentInput = {
    id: string;
    recipeId: string;
};

export function useDeleteComment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id }: DeleteCommentInput) => deleteComment(id),
        onSuccess: (_data, variables) => {
            invalidateRecipeCommentQueries(queryClient, variables.recipeId);
        }
    });
}

type ToggleCommentLikeInput = {
    commentId: string;
    recipeId: string;
    isLiked: boolean;
};

export function useToggleCommentLike() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ commentId, isLiked }: ToggleCommentLikeInput) =>
            isLiked ? likeComment(commentId) : unlikeComment(commentId),
        onError: (_error, variables: ToggleCommentLikeInput, context) => {
            if (context?.previousComments) {
                queryClient.setQueryData(commentsQueryKey(variables.recipeId), context.previousComments);
            }
        },
        onMutate: async ({ commentId, recipeId, isLiked }: ToggleCommentLikeInput) => {
            await queryClient.cancelQueries({ queryKey: commentsQueryKey(recipeId) });

            const previousComments = queryClient.getQueryData<CommentWithMeta[]>(commentsQueryKey(recipeId));

            queryClient.setQueryData<CommentWithMeta[]>(commentsQueryKey(recipeId), (comments) =>
                comments?.map((comment) =>
                    comment.id === commentId
                        ? { ...comment, likeCount: comment.likeCount + (isLiked ? 1 : -1), likedByMe: isLiked }
                        : comment
                )
            );

            return { previousComments };
        },
        onSettled: (_data, _error, variables: ToggleCommentLikeInput) => {
            queryClient.invalidateQueries({ queryKey: commentsQueryKey(variables.recipeId) });
        }
    });
}
