import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatRelativeTime } from './relativeTime';

const NOW = new Date('2026-08-05T12:00:00.000Z');

describe('formatRelativeTime', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(NOW);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns "Today" for a timestamp from earlier today', () => {
        expect(formatRelativeTime('2026-08-05T08:00:00.000Z')).toBe('Today');
    });

    it('returns "Yesterday" for a timestamp exactly one day ago', () => {
        expect(formatRelativeTime('2026-08-04T12:00:00.000Z')).toBe('Yesterday');
    });

    it('returns a day count for timestamps within the last week', () => {
        expect(formatRelativeTime('2026-08-01T12:00:00.000Z')).toBe('4 days ago');
    });

    it('falls back to a formatted date beyond a week', () => {
        const eightDaysAgo = '2026-07-20T12:00:00.000Z';

        expect(formatRelativeTime(eightDaysAgo)).toBe(
            new Date(eightDaysAgo).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
        );
    });
});
