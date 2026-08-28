export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return 'Please choose a JPG, PNG, or WEBP image.';
    }

    if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
        return 'Image must be smaller than 5MB.';
    }

    return null;
}
