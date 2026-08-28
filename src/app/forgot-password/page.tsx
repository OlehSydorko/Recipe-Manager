'use client';

import { Suspense, useState } from 'react';
import { requestPasswordReset } from '@/api/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={null}>
            <ForgotPasswordPageContent />
        </Suspense>
    );
}

function ForgotPasswordPageContent() {
    const searchParams = useSearchParams();
    const isInvalidLink = searchParams.get('error') === 'invalid-link';

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);

        try {
            await requestPasswordReset(email);
        } catch {
        } finally {
            setLoading(false);
            setSubmitted(true);
        }
    };

    return (
        <main className='flex min-h-screen items-center justify-center bg-bg px-4'>
            <div className='w-full max-w-sm space-y-5 rounded-lg border border-border bg-surface p-8 shadow-md'>
                <h1 className='text-display font-semibold text-text-primary'>Reset your password</h1>

                {submitted ? (
                    <>
                        <p className='text-body text-text-primary'>
                            If an account exists for that email, we&apos;ve sent a link to reset your password.
                        </p>

                        <p className='text-body text-text-primary'>
                            P.S If u didn&apos;t receive it, please check the Spam section
                        </p>

                        <p className='text-body text-text-secondary'>
                            <Link href='/login' className='font-medium text-accent hover:underline'>
                                Back to log in
                            </Link>
                        </p>
                    </>
                ) : (
                    <form onSubmit={handleSubmit} className='space-y-5'>
                        {isInvalidLink && (
                            <p className='rounded-md border border-accent/30 bg-accent-muted px-3 py-2 text-body text-text-primary'>
                                That reset link is invalid or has expired. Enter your email to request a new one.
                            </p>
                        )}

                        <p className='text-body text-text-secondary'>
                            Enter the email address associated with your account and we&apos;ll send you a link to
                            reset your password.
                        </p>

                        <div>
                            <label
                                htmlFor='email'
                                className='mb-1.5 block text-label font-medium text-text-secondary'
                            >
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

                        <Button type='submit' variant='primary' disabled={loading} fullWidth>
                            {loading ? 'Sending…' : 'Send reset link'}
                        </Button>

                        <p className='text-body text-text-secondary'>
                            Remembered it?{' '}
                            <Link href='/login' className='font-medium text-accent hover:underline'>
                                Log in
                            </Link>
                        </p>
                    </form>
                )}
            </div>
        </main>
    );
}
