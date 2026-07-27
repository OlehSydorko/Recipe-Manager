import { Nav } from '@/components/Nav';
import { Sidebar } from '@/components/Sidebar';

export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <div className='min-h-screen'>
            <Nav />
            <div className='mx-auto flex max-w-4xl'>
                <Sidebar />
                <main className='flex-1 px-4 py-8'>{children}</main>
            </div>
        </div>
    );
}
