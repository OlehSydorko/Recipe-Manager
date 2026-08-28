'use client';

import { Skeleton } from '@/components/ui/Skeleton';
import { Folder } from 'lucide-react';

type CollectionCoverMosaicProps = {
    imageUrls: (string | undefined)[];
};

export function CollectionCoverMosaic({ imageUrls }: CollectionCoverMosaicProps) {
    if (imageUrls.length === 0) {
        return (
            <div className='flex h-full w-full items-center justify-center text-text-disabled'>
                <Folder size={28} />
            </div>
        );
    }

    if (imageUrls.length === 1) {
        return <MosaicCell url={imageUrls[0]} />;
    }

    if (imageUrls.length === 2) {
        return (
            <div className='grid h-full w-full grid-cols-2 gap-0.5 bg-bg-secondary'>
                <MosaicCell url={imageUrls[0]} />
                <MosaicCell url={imageUrls[1]} />
            </div>
        );
    }

    if (imageUrls.length === 3) {
        return (
            <div className='grid h-full w-full grid-rows-2 gap-0.5 bg-bg-secondary'>
                <div className='grid grid-cols-2 gap-0.5'>
                    <MosaicCell url={imageUrls[0]} />
                    <MosaicCell url={imageUrls[1]} />
                </div>
                <MosaicCell url={imageUrls[2]} />
            </div>
        );
    }

    return (
        <div className='grid h-full w-full grid-cols-2 grid-rows-2 gap-0.5 bg-bg-secondary'>
            <MosaicCell url={imageUrls[0]} />
            <MosaicCell url={imageUrls[1]} />
            <MosaicCell url={imageUrls[2]} />
            <MosaicCell url={imageUrls[3]} />
        </div>
    );
}

type MosaicCellProps = {
    url?: string;
};

function MosaicCell({ url }: MosaicCellProps) {
    if (!url) {
        return <Skeleton className='h-full w-full rounded-none' />;
    }

    return (
        <div className='h-full w-full overflow-hidden bg-bg-secondary'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt='' className='h-full w-full object-cover' />
        </div>
    );
}
