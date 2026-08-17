import { AuthListener } from '@/components/layout/AuthListener';
import { QueryProvider } from '@/components/layout/QueryProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin']
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin']
});

export const metadata: Metadata = {
    title: 'Recipe Manager',
    description: 'Your private recipe vault.'
};

export default function RootLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang='en' className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
            <body className='min-h-full flex flex-col'>
                <QueryProvider>
                    <AuthListener />
                    <ToastProvider>{children}</ToastProvider>
                </QueryProvider>
                <Analytics />
            </body>
        </html>
    );
}
