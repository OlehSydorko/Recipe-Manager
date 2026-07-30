'use client';

import { useEffect, useState } from 'react';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

type RecipeImagePickerProps = {
    existingImageUrl: string | null;
    file: File | null;
    onFileChange: (file: File | null) => void;
    removed: boolean;
    onRemove: () => void;
    disabled?: boolean;
};

export function RecipeImagePicker({
    existingImageUrl,
    file,
    onFileChange,
    removed,
    onRemove,
    disabled
}: RecipeImagePickerProps) {
    const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);

    // Local preview for a freshly-picked file, before it's uploaded.
    useEffect(() => {
        if (!file) {
            setLocalPreviewUrl(null);

            return undefined;
        }

        const objectUrl = URL.createObjectURL(file);

        setLocalPreviewUrl(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

    const previewUrl = localPreviewUrl ?? (removed ? null : existingImageUrl);

    const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selected = event.target.files?.[0] ?? null;

        // Allow re-selecting the same file later (e.g. after removing it).
        event.target.value = '';

        if (!selected) {
            return;
        }

        if (!ALLOWED_IMAGE_TYPES.includes(selected.type)) {
            setValidationError('Please choose a JPG, PNG, or WEBP image.');

            return;
        }

        if (selected.size > MAX_FILE_SIZE_BYTES) {
            setValidationError('Image must be smaller than 5MB.');

            return;
        }

        setValidationError(null);
        onFileChange(selected);
    };

    return (
        <div>
            <span className='block text-sm font-medium'>
                Photo <span className='font-normal text-gray-500'>(optional)</span>
            </span>

            {previewUrl && (
                <img src={previewUrl} alt='Recipe preview' className='mt-2 h-40 w-40 rounded object-cover' />
            )}

            <div className='mt-2 flex items-center gap-2'>
                <input
                    type='file'
                    accept='image/jpeg,image/png,image/webp'
                    onChange={handleFileInputChange}
                    disabled={disabled}
                    className='text-sm'
                />

                {previewUrl && (
                    <button
                        type='button'
                        onClick={onRemove}
                        disabled={disabled}
                        className='rounded border px-3 py-2 text-sm disabled:opacity-50'
                    >
                        Remove
                    </button>
                )}
            </div>

            {validationError && <p className='mt-1 text-sm text-red-600'>{validationError}</p>}
        </div>
    );
}
