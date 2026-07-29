export type Recipe = {
    id: string;
    user_id: string;
    category_id: string;
    title: string;
    description: string | null;
    instructions: string | null;
    image_url: string | null;
    created_at: string;
    updated_at: string;
};
