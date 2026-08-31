import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GeminiConfigError, GeminiExtractionError, callGeminiForImageImport } from './callGemini';

const mockFetch = vi.fn();

function geminiResponse(jsonText: string, ok = true) {
    return {
        ok,
        status: ok ? 200 : 500,
        json: async () => ({ candidates: [{ content: { parts: [{ text: jsonText }] } }] })
    };
}

const VALID_EXTRACTED_RECIPE = {
    title: 'Pancakes',
    description: null,
    portions: 4,
    categoryHint: 'Breakfast',
    sections: [],
    ingredients: [{ name: 'Flour', quantity: '2', unit: 'cup', section: null }],
    steps: [{ instruction: 'Mix and cook.', section: null }]
};

beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
    vi.stubEnv('GEMINI_API_KEY', 'test-key');
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
});

describe('callGeminiForImageImport', () => {
    it('throws GeminiConfigError when GEMINI_API_KEY is not set', async () => {
        vi.stubEnv('GEMINI_API_KEY', '');

        await expect(
            callGeminiForImageImport([{ base64: 'base64data', mimeType: 'image/png' }])
        ).rejects.toBeInstanceOf(GeminiConfigError);
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('returns the parsed, schema-validated recipe on success', async () => {
        mockFetch.mockResolvedValueOnce(geminiResponse(JSON.stringify(VALID_EXTRACTED_RECIPE)));

        const result = await callGeminiForImageImport([{ base64: 'base64data', mimeType: 'image/png' }]);

        expect(result).toEqual(VALID_EXTRACTED_RECIPE);
        expect(mockFetch).toHaveBeenCalledTimes(1);
        const [url, init] = mockFetch.mock.calls[0];

        expect(url).toContain('generativelanguage.googleapis.com');
        expect(init.headers['x-goog-api-key']).toBe('test-key');
    });

    it('throws GeminiExtractionError when the response is not ok, after retrying', async () => {
        mockFetch.mockResolvedValue(geminiResponse('', false));

        await expect(
            callGeminiForImageImport([{ base64: 'base64data', mimeType: 'image/png' }])
        ).rejects.toBeInstanceOf(GeminiExtractionError);
        expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('throws GeminiExtractionError when the model response is not valid JSON, after retrying', async () => {
        mockFetch.mockResolvedValue(geminiResponse('not json at all'));

        await expect(
            callGeminiForImageImport([{ base64: 'base64data', mimeType: 'image/png' }])
        ).rejects.toBeInstanceOf(GeminiExtractionError);
        expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('throws GeminiExtractionError when the JSON does not match the schema, after retrying', async () => {
        mockFetch.mockResolvedValue(geminiResponse(JSON.stringify({ title: '' })));

        await expect(
            callGeminiForImageImport([{ base64: 'base64data', mimeType: 'image/png' }])
        ).rejects.toBeInstanceOf(GeminiExtractionError);
        expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('succeeds on a later attempt after an earlier one fails', async () => {
        mockFetch
            .mockResolvedValueOnce(geminiResponse('', false))
            .mockResolvedValueOnce(geminiResponse(JSON.stringify(VALID_EXTRACTED_RECIPE)));

        const result = await callGeminiForImageImport([{ base64: 'base64data', mimeType: 'image/png' }]);

        expect(result).toEqual(VALID_EXTRACTED_RECIPE);
        expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('sends one inlineData part per image plus a trailing text instruction', async () => {
        mockFetch.mockResolvedValueOnce(geminiResponse(JSON.stringify(VALID_EXTRACTED_RECIPE)));

        await callGeminiForImageImport([
            { base64: 'first', mimeType: 'image/png' },
            { base64: 'second', mimeType: 'image/jpeg' }
        ]);

        const [, init] = mockFetch.mock.calls[0];
        const body = JSON.parse(init.body);
        const parts = body.contents[0].parts;

        expect(parts).toHaveLength(3);
        expect(parts[0]).toEqual({ inlineData: { mimeType: 'image/png', data: 'first' } });
        expect(parts[1]).toEqual({ inlineData: { mimeType: 'image/jpeg', data: 'second' } });
        expect(typeof parts[2].text).toBe('string');
        expect(parts[2].text).toContain('Read all of them together');
    });

    it('uses single-photo phrasing for exactly one image', async () => {
        mockFetch.mockResolvedValueOnce(geminiResponse(JSON.stringify(VALID_EXTRACTED_RECIPE)));

        await callGeminiForImageImport([{ base64: 'first', mimeType: 'image/png' }]);

        const [, init] = mockFetch.mock.calls[0];
        const body = JSON.parse(init.body);
        const parts = body.contents[0].parts;

        expect(parts).toHaveLength(2);
        expect(parts[1].text).toContain('This is a photo or screenshot of a recipe');
    });
});

describe('prompt guidance for cup + parenthetical-gram ingredient lines', () => {
    it('instructs the model to prefer the parenthetical gram weight over the volume measurement', async () => {
        mockFetch.mockResolvedValueOnce(geminiResponse(JSON.stringify(VALID_EXTRACTED_RECIPE)));

        await callGeminiForImageImport([{ base64: 'first', mimeType: 'image/png' }]);

        const [, init] = mockFetch.mock.calls[0];
        const body = JSON.parse(init.body);
        const systemText: string = body.systemInstruction.parts[0].text;

        expect(systemText).toContain('parenthetical weight conversion');
        expect(systemText).toContain('prefer the WEIGHT from the parenthetical');
        expect(systemText).toContain('Do not leave quantity blank');

        const responseSchemaJson = JSON.stringify(body.generationConfig.responseSchema);

        expect(responseSchemaJson).toContain('use the weight from the parenthetical');
    });
});
