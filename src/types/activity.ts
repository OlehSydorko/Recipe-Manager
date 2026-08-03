export type ActivityType = 'recipe_created' | 'recipe_favorited' | 'followed_user' | 'collection_created';

export type ActivityItem = {
    id: string;
    type: ActivityType;
    created_at: string;
    recipeId: string | null;
    recipeTitle: string | null;
    targetUserId: string | null;
    targetDisplayName: string | null;
};
