export function isFormDirty<T>(initial: T | null, current: T): boolean {
    if (initial === null) {
        return false;
    }

    return JSON.stringify(initial) !== JSON.stringify(current);
}
