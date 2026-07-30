export type Recipe = {
    id: string;
    user_id: string;
    category_id: string;
    title: string;
    description: string | null;
    instructions: string | null;
    // Path of the image within the private `recipe-images` storage bucket
    // ({user_id}/{recipe_id}/{filename}), not a public URL. Resolve to a
    // viewable URL with useRecipeImageUrl.
    image_url: string | null;
    created_at: string;
    updated_at: string;
};
