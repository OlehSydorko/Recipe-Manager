export function extractImageFileFromClipboard(clipboardData: DataTransfer | null): File | null {
    if (!clipboardData) {
        return null;
    }

    const imageItem = Array.from(clipboardData.items).find(
        (item) => item.kind === 'file' && item.type.startsWith('image/')
    );

    return imageItem ? imageItem.getAsFile() : null;
}
