// eslint-disable-next-line security/detect-unsafe-regex
export const QUANTITY_PATTERN = /^\d*(?:\.\d*)?(?:\/\d*)?$/;

const UNICODE_FRACTIONS: Record<string, [number, number]> = {
    '¼': [1, 4],
    '½': [1, 2],
    '¾': [3, 4],
    '⅐': [1, 7],
    '⅑': [1, 9],
    '⅒': [1, 10],
    '⅓': [1, 3],
    '⅔': [2, 3],
    '⅕': [1, 5],
    '⅖': [2, 5],
    '⅗': [3, 5],
    '⅘': [4, 5],
    '⅙': [1, 6],
    '⅚': [5, 6],
    '⅛': [1, 8],
    '⅜': [3, 8],
    '⅝': [5, 8],
    '⅞': [7, 8]
};

// eslint-disable-next-line security/detect-unsafe-regex
const MIXED_NUMBER_PATTERN = /^(\d+)?\s*([¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])$/;

export function normalizeQuantity(raw: string): string {
    const trimmed = raw.trim().replace(/⁄/g, '/');

    const match = MIXED_NUMBER_PATTERN.exec(trimmed);

    if (!match) {
        return trimmed;
    }

    const [, wholePart, fractionChar] = match;
    const [numerator, denominator] = UNICODE_FRACTIONS[fractionChar];

    if (!wholePart) {
        return `${numerator}/${denominator}`;
    }

    return formatQuantity(Number(wholePart) + numerator / denominator);
}

export function parseQuantity(raw: string | null): number | null {
    const trimmed = normalizeQuantity(raw?.trim() ?? '');

    if (!trimmed || !QUANTITY_PATTERN.test(trimmed)) {
        return null;
    }

    const slashIndex = trimmed.indexOf('/');

    if (slashIndex === -1) {
        const value = Number(trimmed);

        return Number.isFinite(value) ? value : null;
    }

    const numerator = Number(trimmed.slice(0, slashIndex));
    const denominator = Number(trimmed.slice(slashIndex + 1));

    if (!Number.isFinite(numerator) || !denominator) {
        return null;
    }

    return numerator / denominator;
}

export function formatQuantity(value: number): string {
    return Number(value.toFixed(2)).toString();
}

export function scaleQuantity(raw: string | null, factor: number): string | null {
    if (!raw || factor === 1) {
        return raw;
    }

    const parsed = parseQuantity(raw);

    if (parsed === null) {
        return raw;
    }

    return formatQuantity(parsed * factor);
}
