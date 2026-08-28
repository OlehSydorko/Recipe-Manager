import { describe, expect, it } from 'vitest';
import { formatQuantity, normalizeQuantity, parseQuantity, scaleQuantity } from './quantity';

describe('normalizeQuantity', () => {
    it('converts a bare Unicode fraction to a plain fraction', () => {
        expect(normalizeQuantity('¼')).toBe('1/4');
        expect(normalizeQuantity('⅔')).toBe('2/3');
    });

    it('converts a mixed number to a decimal', () => {
        expect(normalizeQuantity('2¼')).toBe('2.25');
        expect(normalizeQuantity('2 ¼')).toBe('2.25');
    });

    it('converts the Unicode fraction slash to a regular slash', () => {
        expect(normalizeQuantity('1⁄2')).toBe('1/2');
    });

    it('leaves an already-plain quantity unchanged', () => {
        expect(normalizeQuantity('1/3')).toBe('1/3');
        expect(normalizeQuantity('1.5')).toBe('1.5');
        expect(normalizeQuantity('2')).toBe('2');
    });

    it('leaves unparseable text unchanged', () => {
        expect(normalizeQuantity('a pinch')).toBe('a pinch');
    });
});

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

    it('parses a Unicode fraction', () => {
        expect(parseQuantity('¼')).toBe(0.25);
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
