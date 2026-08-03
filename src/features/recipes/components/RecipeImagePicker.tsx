'use client';

import { type ChangeEvent, type DragEvent, useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, X } from 'lucide-react';

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
    const inputRef = useRef<HTMLInputElement>(null);

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

    const processFile = (selected: File | null) => {
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

    const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const selected = event.target.files?.[0] ?? null;

        // Allow re-selecting the same file later (e.g. after removing it).
        event.target.value = '';
        processFile(selected);
    };

    const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
        event.preventDefault();

        if (disabled) {
            return;
        }

        processFile(event.dataTransfer.files?.[0] ?? null);
    };

    return (
        <div>
            <span className='mb-1.5 block text-label font-medium text-text-secondary'>
                Photo <span className='font-normal text-text-disabled'>(optional)</span>
            </span>

            {previewUrl ? (
                <div className='relative w-40'>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewUrl} alt='Recipe preview' className='h-40 w-40 rounded-lg object-cover' />
                    <button
                        type='button'
                        onClick={onRemove}
                        disabled={disabled}
                        aria-label='Remove photo'
                        className='absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface-elevated text-text-secondary shadow-md transition-colors duration-150 hover:text-error disabled:cursor-not-allowed disabled:opacity-50'
                    >
                        <X size={14} />
                    </button>
                </div>
            ) : (
                <button
                    type='button'
                    disabled={disabled}
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={handleDrop}
                    className='flex h-32 w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border-strong bg-bg-secondary text-text-secondary transition-colors duration-150 hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50 sm:w-64'
                >
                    <ImageIcon size={22} />
                    <span className='text-caption'>Click or drag a photo here</span>
                </button>
            )}

            <input
                ref={inputRef}
                type='file'
                accept='image/jpeg,image/png,image/webp'
                onChange={handleFileInputChange}
                disabled={disabled}
                className='hidden'
            />

            {validationError && <p className='mt-1.5 text-caption text-error'>{validationError}</p>}
        </div>
    );
}
