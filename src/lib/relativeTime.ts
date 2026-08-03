const DAY_MS = 24 * 60 * 60 * 1000;

// No date library in this project (see package.json) — a coarse bucket is
// all the activity feed needs, so a small local helper is enough.
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
