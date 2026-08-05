import { describe, expect, it } from 'vitest';
import { formatQuantity, parseQuantity, scaleQuantity } from './quantity';

describe('parseQuantity', () => {
    it('parses a plain integer', () => {
        expect(parseQuantity('2')).toBe(2);
    });

    it('parses a decimal', () => {
        expect(parseQuantity('1.5')).toBe(1.5);
    });

    it('parses a fraction', () => {
        expect(parseQuantity('1/2')).toBe(0.5);
    });

    it('returns null for empty input', () => {
        expect(parseQuantity('')).toBeNull();
        expect(parseQuantity(null)).toBeNull();
    });

    it('returns null for unparseable input', () => {
        expect(parseQuantity('a bunch')).toBeNull();
    });

    it('returns null for a fraction with a zero denominator', () => {
        expect(parseQuantity('1/0')).toBeNull();
    });
});

describe('formatQuantity', () => {
    it('trims trailing zeros', () => {
        expect(formatQuantity(2)).toBe('2');
    });

    it('rounds to 2 decimal places', () => {
        expect(formatQuantity(33.333333)).toBe('33.33');
    });
});

describe('scaleQuantity', () => {
    it('returns the raw string unchanged at 1x', () => {
        expect(scaleQuantity('1/2', 1)).toBe('1/2');
    });

    it('scales a plain number', () => {
        expect(scaleQuantity('2', 3)).toBe('6');
    });

    it('scales a fraction', () => {
        expect(scaleQuantity('1/2', 4)).toBe('2');
    });

    it('returns the raw string unchanged when it cannot be parsed', () => {
        expect(scaleQuantity('a pinch', 2)).toBe('a pinch');
    });

    it('returns null when raw is null', () => {
        expect(scaleQuantity(null, 2)).toBeNull();
    });
});
