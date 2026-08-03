export type Recipe = {
    id: string;
    user_id: string;
    category_id: string;
    title: string;
    description: string | null;
    instructions: string | null;
    // Base portion count the saved ingredient quantities represent. The
    // Portions changer scales quantities from this baseline for display only.
    portions: number;
    // Path of the image within the private `recipe-images` storage bucket
    // ({user_id}/{recipe_id}/{filename}), not a public URL. Resolve to a
    // viewable URL with useRecipeImageUrl.
    image_url: string | null;
    is_favorite: boolean;
    created_at: string;
    updated_at: string;
};
