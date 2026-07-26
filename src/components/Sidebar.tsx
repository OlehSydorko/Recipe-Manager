import Link from 'next/link';

export function Sidebar() {
    return (
        <aside className='w-48 shrink-0 border-r px-4 py-6'>
            <nav className='flex flex-col gap-2'>
                <Link href='/' className='text-sm'>
                    Home
                </Link>
                <Link href='/categories' className='text-sm'>
                    Categories
                </Link>
            </nav>
        </aside>
    );
}
