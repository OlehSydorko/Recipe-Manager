// Generic dirty-check shared by the recipe forms (new + edit) to decide
// whether the Leave button should confirm before navigating away.
// `initial` is `null` while the baseline hasn't loaded yet (e.g. edit mode
// waiting on the recipe fetch) — nothing can be dirty until it has.
export function isFormDirty<T>(initial: T | null, current: T): boolean {
    if (initial === null) {
        return false;
    }

    return JSON.stringify(initial) !== JSON.stringify(current);
}
