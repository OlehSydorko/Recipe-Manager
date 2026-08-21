'use client';

import { useState } from 'react';
import { signOut, updatePassword } from '@/api/auth';
import { Button } from '@/components/ui/Button';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { useRouter } from 'next/navigation';

// Only reachable with an active session, which middleware.ts requires here --
// that session comes from /auth/confirm having just verified the emailed
// recovery token, not from a normal sign-in.
export default function ResetPasswordPage() {
    const router = useRouter();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError('Passwords do not match.');

            return;
        }

        setLoading(true);

        try {
            await updatePassword(password);
            // Sign out of the recovery session so the user comes back through
            // a normal login with their new password, per the intended flow.
            await signOut();
            router.push('/login?message=password-reset');
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
            setLoading(false);
        }
    };

    return (
        <main className='flex min-h-screen items-center justify-center bg-bg px-4'>
            <form
                onSubmit={handleSubmit}
                className='w-full max-w-sm space-y-5 rounded-lg border border-border bg-surface p-8 shadow-md'
            >
                <h1 className='text-display font-semibold text-text-primary'>Choose a new password</h1>

                {error && <p className='text-body text-error'>{error}</p>}

                <div>
                    <label htmlFor='password' className='mb-1.5 block text-label font-medium text-text-secondary'>
                        New password
                    </label>
                    <PasswordInput
                        id='password'
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        minLength={6}
                    />
                </div>

                <div>
                    <label
                        htmlFor='confirmPassword'
                        className='mb-1.5 block text-label font-medium text-text-secondary'
                    >
                        Confirm password
                    </label>
                    <PasswordInput
                        id='confirmPassword'
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        required
                        minLength={6}
                    />
                </div>

                <Button type='submit' variant='primary' disabled={loading} fullWidth>
                    {loading ? 'Updating…' : 'Update password'}
                </Button>
            </form>
        </main>
    );
}
