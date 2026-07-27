'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { signIn } from '@/API/auth';

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
        <main className='flex min-h-screen items-center justify-center px-4'>
            <form onSubmit={handleSubmit} className='w-full max-w-sm space-y-4'>
                <h1 className='text-2xl font-semibold'>Log in</h1>

                {error && <p className='text-sm text-red-600'>{error}</p>}

                <div>
                    <label htmlFor='email' className='block text-sm font-medium'>
                        Email
                    </label>
                    <input
                        id='email'
                        type='email'
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                        className='mt-1 w-full rounded border px-3 py-2'
                    />
                </div>

                <div>
                    <label htmlFor='password' className='block text-sm font-medium'>
                        Password
                    </label>
                    <input
                        id='password'
                        type='password'
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        className='mt-1 w-full rounded border px-3 py-2'
                    />
                </div>

                <button
                    type='submit'
                    disabled={loading}
                    className='w-full rounded bg-black px-4 py-2 text-white disabled:opacity-50'
                >
                    {loading ? 'Logging in…' : 'Log in'}
                </button>

                <p className='text-sm'>
                    Don&apos;t have an account?{' '}
                    <Link href='/signup' className='underline'>
                        Sign up
                    </Link>
                </p>
            </form>
        </main>
    );
}
