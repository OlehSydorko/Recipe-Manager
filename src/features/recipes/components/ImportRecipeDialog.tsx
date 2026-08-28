'use client';

import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { useImportRecipeFromImage } from '@/hooks/useImportRecipe';
import { usePasteImageFile } from '@/hooks/usePasteImageFile';
import { validateImageFile } from '@/lib/imageFileValidation';
import type { ExtractedRecipe } from '@/lib/recipeImport/schema';
import { Image as ImageIcon, X } from 'lucide-react';

type ImportRecipeDialogProps = {
    open: boolean;
    onClose: () => void;
    onImported: (extracted: ExtractedRecipe) => void;
};

const MAX_IMPORT_IMAGES = 5;

export function ImportRecipeDialog({ open, onClose, onImported }: ImportRecipeDialogProps) {
    const { showToast } = useToast();
    const importFromImage = useImportRecipeFromImage();
    const screenshotInputRef = useRef<HTMLInputElement>(null);

    const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
    const [screenshotError, setScreenshotError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setScreenshotFiles([]);
            setScreenshotError(null);
        }
    }, [open]);

    const isPending = importFromImage.isPending;

    const handleImportSuccess = (extracted: ExtractedRecipe) => {
        onImported(extracted);
        onClose();
    };

    const handleImportError = (error: unknown) => {
        showToast('error', error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    };

    const processScreenshotFiles = (selected: File[]) => {
        if (selected.length === 0) {
            return;
        }

        if (screenshotFiles.length + selected.length > MAX_IMPORT_IMAGES) {
            setScreenshotError(`You can add up to ${MAX_IMPORT_IMAGES} photos.`);

            return;
        }

        for (const file of selected) {
            const error = validateImageFile(file);

            if (error) {
                setScreenshotError(error);

                return;
            }
        }

        setScreenshotError(null);
        setScreenshotFiles((previous) => [...previous, ...selected]);
    };

    const handleScreenshotPaste = usePasteImageFile((file) => processScreenshotFiles([file]));

    const handleScreenshotChange = (event: ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(event.target.files ?? []);

        event.target.value = '';
        processScreenshotFiles(selected);
    };

    const handleRemoveScreenshot = (index: number) => {
        setScreenshotFiles((previous) => previous.filter((_, fileIndex) => fileIndex !== index));
        setScreenshotError(null);
    };

    const handleImageSubmit = (event: FormEvent) => {
        event.preventDefault();

        if (screenshotFiles.length === 0 || isPending) {
            return;
        }

        importFromImage.mutate(screenshotFiles, { onSuccess: handleImportSuccess, onError: handleImportError });
    };

    return (
        <Modal open={open} onClose={onClose} title='Import a recipe'>
            <form onSubmit={handleImageSubmit} className='mt-2 space-y-3'>
                <div>
                    <span className='mb-1.5 block text-label font-medium text-text-secondary'>
                        Screenshots or photos
                    </span>

                    {screenshotFiles.length > 0 && (
                        <ul className='mb-2 space-y-1.5'>
                            {screenshotFiles.map((file, index) => (
                                <li
                                    key={`${file.name}-${index}`}
                                    className='flex items-center justify-between gap-2 rounded-md border border-border bg-bg-secondary px-3 py-2.5 text-body text-text-primary'
                                >
                                    <span className='truncate'>{file.name}</span>
                                    <button
                                        type='button'
                                        onClick={() => handleRemoveScreenshot(index)}
                                        disabled={isPending}
                                        aria-label={`Remove ${file.name}`}
                                        className='shrink-0 text-text-secondary transition-colors duration-150 hover:text-error disabled:cursor-not-allowed'
                                    >
                                        <X size={14} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    {screenshotFiles.length < MAX_IMPORT_IMAGES && (
                        <div
                            tabIndex={isPending ? -1 : 0}
                            onPaste={isPending ? undefined : handleScreenshotPaste}
                            className={`flex h-24 w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border-strong bg-bg-secondary text-text-secondary transition-colors duration-150 ${
                                isPending
                                    ? 'cursor-not-allowed opacity-50'
                                    : 'focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40'
                            }`}
                        >
                            <ImageIcon size={20} />
                            <span className='text-caption'>
                                <button
                                    type='button'
                                    onClick={() => screenshotInputRef.current?.click()}
                                    disabled={isPending}
                                    className='font-medium text-accent hover:underline disabled:cursor-not-allowed'
                                >
                                    Browse
                                </button>{' '}
                                for {screenshotFiles.length > 0 ? 'more photos' : 'a photo'}
                            </span>
                            <span className='text-caption text-text-disabled'>or click here, then paste (Ctrl+V)</span>
                        </div>
                    )}

                    <input
                        ref={screenshotInputRef}
                        type='file'
                        accept='image/jpeg,image/png,image/webp'
                        multiple
                        onChange={handleScreenshotChange}
                        disabled={isPending}
                        className='hidden'
                    />

                    {screenshotError && <p className='mt-1.5 text-caption text-error'>{screenshotError}</p>}
                </div>

                <div className='flex justify-end gap-2 pt-1'>
                    <Button type='button' variant='ghost' onClick={onClose} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button type='submit' variant='primary' disabled={isPending || screenshotFiles.length === 0}>
                        {importFromImage.isPending ? 'Analyzing the photos…' : 'Import'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
