import { MobileTabBar } from '@/components/MobileTabBar';
import { Nav } from '@/components/Nav';
import { Sidebar } from '@/components/Sidebar';

export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <div className='min-h-screen bg-bg'>
            <Nav />
            <div className='mx-auto flex max-w-5xl'>
                <Sidebar />
                <main className='min-w-0 flex-1 px-4 py-8 pb-24 sm:px-6 sm:pb-8'>{children}</main>
            </div>
            <MobileTabBar />
        </div>
    );
}
