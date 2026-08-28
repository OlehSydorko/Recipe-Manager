import { describe, expect, it } from 'vitest';
import { MAX_IMAGE_FILE_SIZE_BYTES, validateImageFile } from './imageFileValidation';

function makeFile({ type = 'image/png', size = 1024 }: { type?: string; size?: number } = {}): File {
    return new File([new Uint8Array(size)], 'photo', { type });
}

describe('validateImageFile', () => {
    it('accepts a JPG/PNG/WEBP image under the size limit', () => {
        expect(validateImageFile(makeFile({ type: 'image/jpeg' }))).toBeNull();
        expect(validateImageFile(makeFile({ type: 'image/png' }))).toBeNull();
        expect(validateImageFile(makeFile({ type: 'image/webp' }))).toBeNull();
    });

    it('rejects an unsupported file type', () => {
        expect(validateImageFile(makeFile({ type: 'image/gif' }))).toBe('Please choose a JPG, PNG, or WEBP image.');
        expect(validateImageFile(makeFile({ type: 'application/pdf' }))).toBe(
            'Please choose a JPG, PNG, or WEBP image.'
        );
    });

    it('rejects a file over the size limit', () => {
        expect(validateImageFile(makeFile({ size: MAX_IMAGE_FILE_SIZE_BYTES + 1 }))).toBe(
            'Image must be smaller than 5MB.'
        );
    });

    it('accepts a file exactly at the size limit', () => {
        expect(validateImageFile(makeFile({ size: MAX_IMAGE_FILE_SIZE_BYTES }))).toBeNull();
    });
});
