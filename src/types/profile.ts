export type Profile = {
    id: string;
    display_name: string | null;
    // Path within the private `avatars` storage bucket ({user_id}/{filename}),
    // not a public URL. Resolve to a viewable URL with useAvatarUrl.
    avatar_url: string | null;
    tagline: string | null;
    location: string | null;
    bio: string | null;
    created_at: string;
};
