export type Step = {
    id: string;
    recipe_id: string;
    instruction: string;
    sort_order: number;
    section_id: string | null;
};

// Local form-row shape used while editing a recipe's steps. `key` is a
// stable React key (existing step id, or a generated one for new rows) and
// is stripped out before the row is sent to the API. `sectionKey` points at
// a SectionDraft.key (see types/section.ts), or null for "no section" —
// resolved to a real section_id right before saving, once the sections
// themselves have been persisted.
export type StepDraft = {
    key: string;
    instruction: string;
    sectionKey: string | null;
};
