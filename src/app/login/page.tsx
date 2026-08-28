'use client';

import { Suspense, useState } from 'react';
import { signIn } from '@/api/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

const MESSAGE_COPY: Record<string, string> = {
    profile: 'Sign in to view your profile.',
    'recipe-new': 'Sign in to create a recipe.',
    'recipe-edit': 'Sign in to edit this recipe.',
    'password-reset': 'Your password has been updated. Log in with your new password.',
    default: 'Sign in to continue.'
};

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginPageContent />
        </Suspense>
    );
}

function LoginPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirect') || '/';
    const messageCode = searchParams.get('message');
    const message = messageCode ? MESSAGE_COPY[messageCode] : null;
    const signupParams = new URLSearchParams();

    if (redirectTo !== '/') {
        signupParams.set('redirect', redirectTo);
    }
    if (messageCode) {
        signupParams.set('message', messageCode);
    }

    const signupQuery = signupParams.toString() ? `?${signupParams.toString()}` : '';
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await signIn(email, password);
            router.push(redirectTo);
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className='flex min-h-screen items-center justify-center bg-bg px-4'>
            <form
                onSubmit={handleSubmit}
                className='w-full max-w-sm space-y-5 rounded-lg border border-border bg-surface p-8 shadow-md'
            >
                <h1 className='text-display font-semibold text-text-primary'>Log in</h1>

                {message && (
                    <p className='rounded-md border border-accent/30 bg-accent-muted px-3 py-2 text-body text-text-primary'>
                        {message}
                    </p>
                )}

                {error && <p className='text-body text-error'>{error}</p>}

                <div>
                    <label htmlFor='email' className='mb-1.5 block text-label font-medium text-text-secondary'>
                        Email
                    </label>
                    <Input
                        id='email'
                        type='email'
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />
                </div>

                <div>
                    <div className='mb-1.5 flex items-center justify-between'>
                        <label htmlFor='password' className='block text-label font-medium text-text-secondary'>
                            Password
                        </label>
                        <Link href='/forgot-password' className='text-label font-medium text-accent hover:underline'>
                            Forgot password?
                        </Link>
                    </div>
                    <PasswordInput
                        id='password'
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                    />
                </div>

                <Button type='submit' variant='primary' disabled={loading} fullWidth>
                    {loading ? 'Logging in…' : 'Log in'}
                </Button>

                <p className='text-body text-text-secondary'>
                    Don&apos;t have an account?{' '}
                    <Link
                        href={`/signup${signupQuery}`}
                        className='font-medium text-accent hover:underline'
                    >
                        Sign up
                    </Link>
                </p>
            </form>
        </main>
    );
}
