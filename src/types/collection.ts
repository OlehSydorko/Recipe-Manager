export type Collection = {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    created_at: string;
};

export type CollectionWithCount = Collection & {
    recipeCount: number;
    coverImagePaths: string[];
};
