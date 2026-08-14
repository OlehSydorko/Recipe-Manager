'use client';

import { useState } from 'react';
import { signIn } from '@/api/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
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
            router.push('/');
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
                    <label htmlFor='password' className='mb-1.5 block text-label font-medium text-text-secondary'>
                        Password
                    </label>
                    <Input
                        id='password'
                        type='password'
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
                    <Link href='/signup' className='font-medium text-accent hover:underline'>
                        Sign up
                    </Link>
                </p>
            </form>
        </main>
    );
}
