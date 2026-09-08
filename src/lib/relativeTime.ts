const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const HOURS_PER_DAY = 24;

export function formatRelativeTime(isoDate: string): string {
    const date = new Date(isoDate);
    const diffDays = Math.floor((Date.now() - date.getTime()) / DAY_MS);

    if (diffDays <= 0) {
        return 'Today';
    }

    if (diffDays === 1) {
        return 'Yesterday';
    }

    if (diffDays < 7) {
        return `${diffDays} days ago`;
    }

    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

// Comments feel real-time in a way recipe cards don't, so this adds minute/hour
// granularity on top of formatRelativeTime rather than changing its day-level
// behavior everywhere else it's already used.
export function formatCommentTime(isoDate: string): string {
    const date = new Date(isoDate);
    const diffMs = Date.now() - date.getTime();

    if (diffMs < MINUTE_MS) {
        return 'Just now';
    }

    if (diffMs < HOUR_MS) {
        return `${Math.floor(diffMs / MINUTE_MS)}m ago`;
    }

    if (diffMs < HOUR_MS * HOURS_PER_DAY) {
        return `${Math.floor(diffMs / HOUR_MS)}h ago`;
    }

    return formatRelativeTime(isoDate);
}
