type SkeletonProps = {
    className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
    return <div className={`animate-shimmer rounded-md ${className ?? ''}`} />;
}

export function TextLineSkeleton({ className }: SkeletonProps) {
    return <Skeleton className={`h-4 ${className ?? ''}`} />;
}

export function RecipeCardSkeleton() {
    return (
        <div className='overflow-hidden rounded-lg border border-border bg-surface'>
            <Skeleton className='aspect-[4/3] w-full rounded-none' />
            <div className='space-y-2 p-4'>
                <Skeleton className='h-4 w-3/4' />
                <Skeleton className='h-3 w-1/3' />
            </div>
        </div>
    );
}
