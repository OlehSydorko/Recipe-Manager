'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { AvatarPicker } from '@/components/AvatarPicker';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { useAvatarUrl, useRemoveAvatar, useUpdateProfile, useUploadAvatar } from '@/hooks/useProfile';
import type { Profile } from '@/types/profile';

type EditProfileModalProps = {
    profile: Profile;
    open: boolean;
    onClose: () => void;
};

export function EditProfileModal({ profile, open, onClose }: EditProfileModalProps) {
    const { data: existingAvatarUrl } = useAvatarUrl(profile.avatar_url);
    const updateProfile = useUpdateProfile();
    const uploadAvatar = useUploadAvatar();
    const removeAvatar = useRemoveAvatar();

    const [displayName, setDisplayName] = useState('');
    const [tagline, setTagline] = useState('');
    const [location, setLocation] = useState('');
    const [bio, setBio] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarRemoved, setAvatarRemoved] = useState(false);

    // Reset the form from the current profile every time the modal opens.
    useEffect(() => {
        if (open) {
            setDisplayName(profile.display_name ?? '');
            setTagline(profile.tagline ?? '');
            setLocation(profile.location ?? '');
            setBio(profile.bio ?? '');
            setAvatarFile(null);
            setAvatarRemoved(false);
        }
    }, [open, profile]);

    const isSubmitting = updateProfile.isPending || uploadAvatar.isPending || removeAvatar.isPending;

    const handleAvatarFileChange = (nextFile: File | null) => {
        setAvatarFile(nextFile);
        setAvatarRemoved(false);
    };

    const handleAvatarRemove = () => {
        setAvatarFile(null);
        setAvatarRemoved(true);
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();

        if (!displayName.trim()) {
            return;
        }

        await updateProfile.mutateAsync({
            displayName: displayName.trim(),
            tagline: tagline.trim(),
            location: location.trim(),
            bio: bio.trim()
        });

        if (avatarFile) {
            await uploadAvatar.mutateAsync({ file: avatarFile, previousPath: profile.avatar_url });
        } else if (avatarRemoved && profile.avatar_url) {
            await removeAvatar.mutateAsync(profile.avatar_url);
        }

        onClose();
    };

    return (
        <Modal open={open} onClose={onClose} title='Edit profile'>
            <form onSubmit={handleSubmit} className='space-y-4'>
                <AvatarPicker
                    existingAvatarUrl={existingAvatarUrl ?? null}
                    file={avatarFile}
                    onFileChange={handleAvatarFileChange}
                    removed={avatarRemoved}
                    onRemove={handleAvatarRemove}
                    disabled={isSubmitting}
                />

                <div>
                    <label htmlFor='display-name' className='mb-1.5 block text-label font-medium text-text-secondary'>
                        Name
                    </label>
                    <Input
                        id='display-name'
                        type='text'
                        value={displayName}
                        onChange={(event) => setDisplayName(event.target.value)}
                        disabled={isSubmitting}
                        required
                    />
                </div>

                <div>
                    <label htmlFor='tagline' className='mb-1.5 block text-label font-medium text-text-secondary'>
                        Tagline <span className='font-normal text-text-disabled'>(optional)</span>
                    </label>
                    <Input
                        id='tagline'
                        type='text'
                        placeholder='e.g. Home Cook'
                        value={tagline}
                        onChange={(event) => setTagline(event.target.value)}
                        disabled={isSubmitting}
                    />
                </div>

                <div>
                    <label htmlFor='location' className='mb-1.5 block text-label font-medium text-text-secondary'>
                        Location <span className='font-normal text-text-disabled'>(optional)</span>
                    </label>
                    <Input
                        id='location'
                        type='text'
                        placeholder='e.g. Vienna, Austria'
                        value={location}
                        onChange={(event) => setLocation(event.target.value)}
                        disabled={isSubmitting}
                    />
                </div>

                <div>
                    <label htmlFor='bio' className='mb-1.5 block text-label font-medium text-text-secondary'>
                        Bio <span className='font-normal text-text-disabled'>(optional)</span>
                    </label>
                    <Textarea
                        id='bio'
                        value={bio}
                        onChange={(event) => setBio(event.target.value)}
                        disabled={isSubmitting}
                        rows={3}
                    />
                </div>

                <div className='flex justify-end gap-2 pt-2'>
                    <Button type='button' variant='ghost' onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type='submit' variant='primary' disabled={isSubmitting}>
                        {isSubmitting ? 'Saving…' : 'Save changes'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
