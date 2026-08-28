import { createEmptyIngredientDraft } from '@/features/recipes/components/IngredientRows';
import { createEmptyStepDraft } from '@/features/recipes/components/StepRows';
import { normalizeQuantity } from '@/lib/quantity';
import type { ExtractedRecipe } from '@/lib/recipeImport/schema';
import type { Category } from '@/types/category';
import { DEFAULT_UNIT, type IngredientDraft, isAllowedUnit } from '@/types/ingredient';
import type { SectionDraft } from '@/types/section';
import type { StepDraft } from '@/types/step';

const DEFAULT_PORTIONS = 1;

export type ImportedFormState = {
    title: string;
    description: string;
    portions: number;
    categoryId: string;
    sections: SectionDraft[];
    ingredients: IngredientDraft[];
    steps: StepDraft[];
};

function matchCategoryId(categoryHint: string | null, categories: Category[]): string {
    if (!categoryHint) {
        return '';
    }

    const normalizedHint = categoryHint.trim().toLowerCase();
    const match = categories.find((category) => category.name.trim().toLowerCase() === normalizedHint);

    return match?.id ?? '';
}

function buildSectionDrafts(sectionNames: string[]): SectionDraft[] {
    const seenNames = new Set<string>();
    const drafts: SectionDraft[] = [];

    for (const rawName of sectionNames) {
        const name = rawName.trim();
        const normalized = name.toLowerCase();

        if (!name || seenNames.has(normalized)) {
            continue;
        }

        seenNames.add(normalized);
        drafts.push({ key: crypto.randomUUID(), name });
    }

    return drafts;
}

function sectionKeysByName(sections: SectionDraft[]): Map<string, string> {
    return new Map(sections.map((section) => [section.name.toLowerCase(), section.key]));
}

function resolveSectionKey(sectionName: string | null, keysByName: Map<string, string>): string | null {
    if (!sectionName) {
        return null;
    }

    return keysByName.get(sectionName.trim().toLowerCase()) ?? null;
}

export function extractedToFormState(extracted: ExtractedRecipe, existingCategories: Category[]): ImportedFormState {
    const sections = buildSectionDrafts(extracted.sections);
    const keysByName = sectionKeysByName(sections);

    const ingredients: IngredientDraft[] = extracted.ingredients.map((ingredient) => {
        const unit = ingredient.unit && isAllowedUnit(ingredient.unit) ? ingredient.unit : DEFAULT_UNIT;

        return {
            key: crypto.randomUUID(),
            name: ingredient.name,
            quantity: normalizeQuantity(ingredient.quantity?.trim() ?? ''),
            unit,
            sectionKey: resolveSectionKey(ingredient.section, keysByName)
        };
    });

    const steps: StepDraft[] = extracted.steps.map((step) => ({
        key: crypto.randomUUID(),
        instruction: step.instruction,
        sectionKey: resolveSectionKey(step.section, keysByName)
    }));

    return {
        title: extracted.title,
        description: extracted.description ?? '',
        portions: extracted.portions ?? DEFAULT_PORTIONS,
        categoryId: matchCategoryId(extracted.categoryHint, existingCategories),
        sections,
        ingredients: ingredients.length > 0 ? ingredients : [createEmptyIngredientDraft()],
        steps: steps.length > 0 ? steps : [createEmptyStepDraft()]
    };
}
