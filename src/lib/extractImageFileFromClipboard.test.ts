import { describe, expect, it } from 'vitest';
import { extractImageFileFromClipboard } from './extractImageFileFromClipboard';

function makeClipboardData(items: Array<{ kind: string; type: string; file?: File }>): DataTransfer {
    return {
        items: items.map(({ kind, type, file }) => ({
            kind,
            type,
            getAsFile: () => file ?? null
        })) as unknown as DataTransferItemList
    } as unknown as DataTransfer;
}

describe('extractImageFileFromClipboard', () => {
    it('returns null when clipboardData is null', () => {
        expect(extractImageFileFromClipboard(null)).toBeNull();
    });

    it('returns null when there is no file item', () => {
        const clipboardData = makeClipboardData([{ kind: 'string', type: 'text/plain' }]);

        expect(extractImageFileFromClipboard(clipboardData)).toBeNull();
    });

    it('returns null when the only file item is not an image', () => {
        const file = new File(['x'], 'notes.txt', { type: 'text/plain' });
        const clipboardData = makeClipboardData([{ kind: 'file', type: 'text/plain', file }]);

        expect(extractImageFileFromClipboard(clipboardData)).toBeNull();
    });

    it('returns the image file when present', () => {
        const file = new File(['x'], 'screenshot.png', { type: 'image/png' });
        const clipboardData = makeClipboardData([{ kind: 'file', type: 'image/png', file }]);

        expect(extractImageFileFromClipboard(clipboardData)).toBe(file);
    });

    it('picks the first image item when the clipboard has multiple items', () => {
        const textFile = new File(['x'], 'notes.txt', { type: 'text/plain' });
        const imageFile = new File(['x'], 'screenshot.png', { type: 'image/png' });
        const clipboardData = makeClipboardData([
            { kind: 'file', type: 'text/plain', file: textFile },
            { kind: 'file', type: 'image/png', file: imageFile }
        ]);

        expect(extractImageFileFromClipboard(clipboardData)).toBe(imageFile);
    });
});
