export type Section = {
    id: string;
    recipe_id: string;
    name: string;
    sort_order: number;
};

// Local form-row shape used while editing a recipe's sections. `key` is a
// stable React key (existing section id, or a generated one for a new
// section) and is what ingredient/step drafts reference locally before the
// section has a real database id — see SectionDraft usages in
// sectionedDrafts.ts.
export type SectionDraft = {
    key: string;
    name: string;
};
