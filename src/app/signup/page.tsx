'use client';

import { Suspense, useState } from 'react';
import { signUp } from '@/api/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

const MESSAGE_COPY: Record<string, string> = {
    profile: 'Sign in to view your profile.',
    'recipe-new': 'Sign in to create a recipe.',
    'recipe-edit': 'Sign in to edit this recipe.',
    default: 'Sign in to continue.'
};

export default function SignupPage() {
    return (
        <Suspense fallback={null}>
            <SignupPageContent />
        </Suspense>
    );
}

function SignupPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirect') || '/';
    const messageCode = searchParams.get('message');
    const message = messageCode ? MESSAGE_COPY[messageCode] : null;
    const loginParams = new URLSearchParams();

    if (redirectTo !== '/') {
        loginParams.set('redirect', redirectTo);
    }
    if (messageCode) {
        loginParams.set('message', messageCode);
    }

    const loginQuery = loginParams.toString() ? `?${loginParams.toString()}` : '';
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await signUp(email, password, displayName);
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
                <h1 className='text-display font-semibold text-text-primary'>Create your account</h1>

                {message && (
                    <p className='rounded-md border border-accent/30 bg-accent-muted px-3 py-2 text-body text-text-primary'>
                        {message}
                    </p>
                )}

                {error && <p className='text-body text-error'>{error}</p>}

                <div>
                    <label htmlFor='displayName' className='mb-1.5 block text-label font-medium text-text-secondary'>
                        Name
                    </label>
                    <Input
                        id='displayName'
                        type='text'
                        value={displayName}
                        onChange={(event) => setDisplayName(event.target.value)}
                        required
                    />
                </div>

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
                    <label htmlFor='password' className='mb-1.5 block text-label font-medium text-text-secondary'>
                        Password
                    </label>
                    <PasswordInput
                        id='password'
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        minLength={6}
                    />
                </div>

                <Button type='submit' variant='primary' disabled={loading} fullWidth>
                    {loading ? 'Creating account…' : 'Sign up'}
                </Button>

                <p className='text-body text-text-secondary'>
                    Already have an account?{' '}
                    <Link
                        href={`/login${loginQuery}`}
                        className='font-medium text-accent hover:underline'
                    >
                        Log in
                    </Link>
                </p>
            </form>
        </main>
    );
}
