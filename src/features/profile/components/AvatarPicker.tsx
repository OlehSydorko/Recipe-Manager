'use client';

import { type ChangeEvent, type DragEvent, useEffect, useRef, useState } from 'react';
import { User, X } from 'lucide-react';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

type AvatarPickerProps = {
    existingAvatarUrl: string | null;
    file: File | null;
    onFileChange: (file: File | null) => void;
    removed: boolean;
    onRemove: () => void;
    disabled?: boolean;
};

export function AvatarPicker({
    existingAvatarUrl,
    file,
    onFileChange,
    removed,
    onRemove,
    disabled
}: AvatarPickerProps) {
    const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!file) {
            setLocalPreviewUrl(null);

            return undefined;
        }

        const objectUrl = URL.createObjectURL(file);

        setLocalPreviewUrl(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

    const previewUrl = localPreviewUrl ?? (removed ? null : existingAvatarUrl);

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

            <div className='relative h-24 w-24'>
                <button
                    type='button'
                    disabled={disabled}
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={handleDrop}
                    className='flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-dashed border-border-strong bg-bg-secondary text-text-secondary transition-colors duration-150 hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50'
                >
                    {previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={previewUrl} alt='Avatar preview' className='h-full w-full object-cover' />
                    ) : (
                        <User size={24} />
                    )}
                </button>

                {previewUrl && (
                    <button
                        type='button'
                        onClick={onRemove}
                        disabled={disabled}
                        aria-label='Remove photo'
                        className='absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-surface-elevated text-text-secondary shadow-md transition-colors duration-150 hover:text-error disabled:cursor-not-allowed disabled:opacity-50'
                    >
                        <X size={13} />
                    </button>
                )}
            </div>

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
