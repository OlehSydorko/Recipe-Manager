export type Step = {
    id: string;
    recipe_id: string;
    instruction: string;
    sort_order: number;
    section_id: string | null;
};

export type StepDraft = {
    key: string;
    instruction: string;
    sectionKey: string | null;
};
