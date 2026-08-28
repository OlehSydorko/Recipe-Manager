import { z } from 'zod';

export const ExtractedIngredientSchema = z.object({
    name: z.string().trim().min(1).max(200),
    quantity: z.string().trim().max(30).nullable(),
    unit: z.string().trim().max(20).nullable(),
    section: z.string().trim().max(80).nullable()
});

export const ExtractedStepSchema = z.object({
    instruction: z.string().trim().min(1).max(2000),
    section: z.string().trim().max(80).nullable()
});

export const ExtractedRecipeSchema = z.object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(1000).nullable(),
    portions: z.number().int().min(1).max(500).nullable(),
    categoryHint: z.string().trim().max(60).nullable(),
    sections: z.array(z.string().trim().min(1).max(80)).max(20),
    ingredients: z.array(ExtractedIngredientSchema).max(150),
    steps: z.array(ExtractedStepSchema).max(100)
});

export type ExtractedIngredient = z.infer<typeof ExtractedIngredientSchema>;
export type ExtractedStep = z.infer<typeof ExtractedStepSchema>;
export type ExtractedRecipe = z.infer<typeof ExtractedRecipeSchema>;

export const GEMINI_RESPONSE_SCHEMA = {
    type: 'object',
    properties: {
        title: { type: 'string' },
        description: { type: 'string', nullable: true },
        portions: { type: 'integer', nullable: true },
        categoryHint: { type: 'string', nullable: true },
        sections: { type: 'array', items: { type: 'string' } },
        ingredients: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                        description:
                            'Only the ingredient name, e.g. all-purpose flour. Never include a quantity, unit, a volume-measurement phrase like "2¼ cups", or a parenthetical weight conversion like (270g) -- those never belong in this field.'
                    },
                    quantity: {
                        type: 'string',
                        nullable: true,
                        description:
                            'The primary amount. When the source states a volume amount followed by a parenthetical weight conversion (e.g. 2¼ cups flour (270g)), use the weight from the parenthetical (270) here, not the volume amount -- and set "unit" to the parenthetical unit (g or kg). Only when no weight conversion is given, preserve the volume amount exactly as written, including fractions and mixed numbers (e.g. 2¼, ⅔, 1/3). Never leave this blank.'
                    },
                    unit: { type: 'string', nullable: true },
                    section: { type: 'string', nullable: true }
                },
                required: ['name']
            }
        },
        steps: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    instruction: { type: 'string' },
                    section: { type: 'string', nullable: true }
                },
                required: ['instruction']
            }
        }
    },
    required: ['title', 'sections', 'ingredients', 'steps']
} as const;
