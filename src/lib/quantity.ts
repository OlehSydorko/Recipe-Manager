import { QUANTITY_PATTERN } from '@/api/ingredients';

// Parses the constrained quantity format the app allows ("1", "1.5", "1/2")
// into a plain number. Returns null for empty or unparseable input so callers
// can fall back to showing the raw string unchanged.
export function parseQuantity(raw: string | null): number | null {
    const trimmed = raw?.trim() ?? '';

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

// Rounds to 2 decimal places and trims trailing zeros (2.0 -> "2", 33.333... -> "33.33").
export function formatQuantity(value: number): string {
    return Number(value.toFixed(2)).toString();
}

// Scales a saved ingredient quantity for a different portion count than the
// recipe's base. Returns the original string unchanged at 1x (so "1/2" stays
// "1/2" instead of becoming "0.5") and whenever parsing fails, so unexpected
// input degrades safely instead of throwing.
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
