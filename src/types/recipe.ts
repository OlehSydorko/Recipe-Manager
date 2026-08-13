export type Recipe = {
    id: string;
    user_id: string;
    category_id: string;
    title: string;
    description: string | null;
    instructions: string | null;
    portions: number;
    image_url: string | null;
    is_favorite: boolean;
    created_at: string;
    updated_at: string;
};

export type RecipeAuthor = {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
};

export type RecipeWithCategory = Recipe & {
    categoryName: string | null;
};


export type RecipeWithAuthor = RecipeWithCategory & {
    author: RecipeAuthor;
};
