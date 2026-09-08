export type Comment = {
    id: string;
    recipe_id: string;
    user_id: string;
    parent_id: string | null;
    rating: number | null;
    body: string | null;
    created_at: string;
    updated_at: string;
};

export type CommentAuthor = {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
};

export type CommentWithMeta = Comment & {
    author: CommentAuthor;
    likeCount: number;
    likedByMe: boolean;
};

export type CommentNode = CommentWithMeta & {
    replies: CommentNode[];
};

export type RatingSummary = {
    averageRating: number | null;
    ratingCount: number;
};
