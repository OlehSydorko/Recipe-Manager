'use client';

type AvatarProps = {
    src?: string | null;
    name?: string | null;
    sizeClassName?: string;
};

function getInitials(name?: string | null): string {
    if (!name) {
        return '?';
    }

    const parts = name.trim().split(/\s+/);
    const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '');

    return initials.join('') || '?';
}

export function Avatar({ src, name, sizeClassName = 'h-9 w-9' }: AvatarProps) {
    if (src) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={src}
                alt={name ?? 'User avatar'}
                className={`shrink-0 rounded-full object-cover ${sizeClassName}`}
            />
        );
    }

    return (
        <span
            aria-hidden='true'
            className={`flex shrink-0 items-center justify-center rounded-full bg-bg-secondary text-label font-semibold text-text-secondary ${sizeClassName}`}
        >
            {getInitials(name)}
        </span>
    );
}
