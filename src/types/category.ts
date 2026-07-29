export type Category = {
    id: string;
    user_id: string;
    name: string;
    created_at: string;
};

// The signup trigger seeds exactly this many categories before a user can create
// their own, so the oldest N (by created_at) are treated as the defaults —
// no schema change or DB migration needed to tell them apart from user-added ones.
export const DEFAULT_CATEGORY_COUNT = 6;
