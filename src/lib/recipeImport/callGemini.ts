import { ALLOWED_UNITS } from '@/types/ingredient';
import { type ExtractedRecipe, ExtractedRecipeSchema, GEMINI_RESPONSE_SCHEMA } from './schema';

const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
const GEMINI_TIMEOUT_MS = 25000;
const MAX_OUTPUT_TOKENS = 8192;
const MAX_EXTRACTION_ATTEMPTS = 3;
const RETRY_DELAY_MS = 500;

export class GeminiConfigError extends Error {
    constructor(message = 'Recipe import is not configured yet.') {
        super(message);
        this.name = 'GeminiConfigError';
    }
}

export class GeminiExtractionError extends Error {
    constructor(message = 'Could not read a recipe from that.') {
        super(message);
        this.name = 'GeminiExtractionError';
    }
}

const SYSTEM_INSTRUCTION = `You are extracting a cooking recipe into a fixed JSON shape for a recipe-manager app. Rules:
- Split combined ingredient strings like "2 cups flour, sifted" into a separate quantity, unit, and name.
- The "unit" field must be one of exactly: ${ALLOWED_UNITS.join(', ')}. If nothing in that list fits (e.g. "cloves", "cans"), leave unit null and put the whole original amount phrase in "quantity" instead.
- Many recipe sites state a volume measurement followed by a parenthetical weight conversion, e.g. "2¼ cups all-purpose flour (270g)" or "⅔ cup whole milk ricotta (165g)". For these: prefer the WEIGHT from the parenthetical -- use it as "quantity" and its unit ("g" or "kg") as "unit" (e.g. "270" / "g", "165" / "g") -- and drop the volume measurement entirely, never appending it (or any part of it) to "name". The correct split of "2¼ cups all-purpose flour (270g)" is quantity "270", unit "g", name "all-purpose flour". Only fall back to the stated volume amount and unit when no parenthetical weight conversion is given at all. Do not leave quantity blank.
- When no weight conversion is given, preserve the quantity exactly as stated, including fractions and mixed numbers (e.g. "2¼", "⅔", "1/3", "1 1/2") -- never round, convert, or drop it.
- Only populate "sections" (and each ingredient/step's "section") when the source recipe visibly groups its ingredients or steps under named headings (e.g. "Dough" / "Filling"). Most recipes have no sections -- leave this empty in that case, do not invent groupings.
- "categoryHint" is your best one- or two-word guess at a recipe category (e.g. "Dessert", "Main course"), or null if you cannot tell.
- "portions" is the number of servings/portions as a plain integer, or null if the source does not state one.
- Never fabricate an ingredient, step, or quantity that is not present in the source.
- Respond with only the JSON object described by the response schema -- no commentary, no markdown code fences.`;

type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Gemini's structured-extraction quality varies call to call -- the same photo can succeed on one
// attempt and come back unparseable or schema-invalid on the next. Retrying a couple of times before
// giving up smooths over that variance without the user having to notice and resubmit manually.
async function runGeminiExtraction(parts: GeminiPart[]): Promise<ExtractedRecipe> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new GeminiConfigError();
    }

    let lastError = new GeminiExtractionError();

    for (let attempt = 1; attempt <= MAX_EXTRACTION_ATTEMPTS; attempt += 1) {
        try {
            return await runGeminiExtractionAttempt(parts, apiKey);
        } catch (error) {
            lastError = error instanceof GeminiExtractionError ? error : new GeminiExtractionError();

            if (attempt < MAX_EXTRACTION_ATTEMPTS) {
                await sleep(RETRY_DELAY_MS);
            }
        }
    }

    throw lastError;
}

async function runGeminiExtractionAttempt(parts: GeminiPart[], apiKey: string): Promise<ExtractedRecipe> {
    const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    let response: Response;

    try {
        response = await fetch(endpoint, {
            method: 'POST',
            signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
            headers: {
                'content-type': 'application/json',
                'x-goog-api-key': apiKey
            },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
                contents: [{ role: 'user', parts }],
                generationConfig: {
                    responseMimeType: 'application/json',
                    responseSchema: GEMINI_RESPONSE_SCHEMA,
                    maxOutputTokens: MAX_OUTPUT_TOKENS
                }
            })
        });
    } catch {
        throw new GeminiExtractionError();
    }

    if (!response.ok) {
        throw new GeminiExtractionError();
    }

    let payload: unknown;

    try {
        payload = await response.json();
    } catch {
        throw new GeminiExtractionError();
    }

    const text = extractResponseText(payload);

    if (!text) {
        throw new GeminiExtractionError();
    }

    let parsedJson: unknown;

    try {
        parsedJson = JSON.parse(text);
    } catch {
        throw new GeminiExtractionError();
    }

    const result = ExtractedRecipeSchema.safeParse(parsedJson);

    if (!result.success) {
        throw new GeminiExtractionError();
    }

    return result.data;
}

type GeminiResponsePayload = {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
};

function extractResponseText(payload: unknown): string | null {
    const candidateText = (payload as GeminiResponsePayload)?.candidates?.[0]?.content?.parts?.[0]?.text;

    return typeof candidateText === 'string' && candidateText.trim() ? candidateText : null;
}

export type ImageImportInput = { base64: string; mimeType: string };

export async function callGeminiForImageImport(images: ImageImportInput[]): Promise<ExtractedRecipe> {
    const imageParts: GeminiPart[] = images.map(({ base64, mimeType }) => ({
        inlineData: { mimeType, data: base64 }
    }));

    const instructionText =
        images.length > 1
            ? 'These are photos or screenshots of the same recipe, in no particular order -- they may show different parts of it (e.g. ingredients on one, steps on another), or be multiple pages or angles of the same handwritten recipe. Read all of them together and produce one combined, structured recipe. Transcribe and structure what you can read.'
            : 'This is a photo or screenshot of a recipe (it may be handwritten, or a phone photo of a page). Transcribe and structure what you can read.';

    return runGeminiExtraction([...imageParts, { text: instructionText }]);
}
