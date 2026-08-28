import { type ClipboardEvent, useCallback } from 'react';
import { extractImageFileFromClipboard } from '@/lib/extractImageFileFromClipboard';

export function usePasteImageFile(onImage: (file: File) => void) {
    return useCallback(
        (event: ClipboardEvent<HTMLElement>) => {
            const file = extractImageFileFromClipboard(event.clipboardData);

            if (!file) {
                return;
            }

            event.preventDefault();
            onImage(file);
        },
        [onImage]
    );
}
