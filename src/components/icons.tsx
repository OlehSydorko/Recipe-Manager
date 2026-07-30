import type { ReactNode } from 'react';

type IconProps = {
    size?: number;
    className?: string;
};

const DEFAULT_SIZE = 20;
const STROKE_WIDTH = 1.75;

function IconBase({ size = DEFAULT_SIZE, className, children }: IconProps & { children: ReactNode }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth={STROKE_WIDTH}
            strokeLinecap='round'
            strokeLinejoin='round'
            aria-hidden='true'
            className={className}
        >
            {children}
        </svg>
    );
}

export function IconHome(props: IconProps) {
    return (
        <IconBase {...props}>
            <path d='M4 11.5 12 4l8 7.5' />
            <path d='M6 10v9a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1v-9' />
        </IconBase>
    );
}

export function IconBook(props: IconProps) {
    return (
        <IconBase {...props}>
            <path d='M5 4.5A2.5 2.5 0 0 1 7.5 2H19v18H7.5A2.5 2.5 0 0 0 5 22.5V4.5Z' />
            <path d='M5 19.5A2.5 2.5 0 0 1 7.5 17H19' />
        </IconBase>
    );
}

export function IconPlus(props: IconProps) {
    return (
        <IconBase {...props}>
            <path d='M12 5v14M5 12h14' />
        </IconBase>
    );
}

export function IconSearch(props: IconProps) {
    return (
        <IconBase {...props}>
            <circle cx='11' cy='11' r='7' />
            <path d='m21 21-4.3-4.3' />
        </IconBase>
    );
}

export function IconX(props: IconProps) {
    return (
        <IconBase {...props}>
            <path d='m6 6 12 12M18 6 6 18' />
        </IconBase>
    );
}

export function IconPencil(props: IconProps) {
    return (
        <IconBase {...props}>
            <path d='M12 20h9' />
            <path d='M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z' />
        </IconBase>
    );
}

export function IconTrash(props: IconProps) {
    return (
        <IconBase {...props}>
            <path d='M4 7h16' />
            <path d='M10 11v6M14 11v6' />
            <path d='M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13' />
            <path d='M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3' />
        </IconBase>
    );
}

export function IconCheck(props: IconProps) {
    return (
        <IconBase {...props}>
            <path d='M20 6 9 17l-5-5' />
        </IconBase>
    );
}

export function IconChevronDown(props: IconProps) {
    return (
        <IconBase {...props}>
            <path d='m6 9 6 6 6-6' />
        </IconBase>
    );
}

export function IconImage(props: IconProps) {
    return (
        <IconBase {...props}>
            <rect x='3' y='3' width='18' height='18' rx='3' />
            <circle cx='9' cy='9' r='2' />
            <path d='m21 15-5-5L5 21' />
        </IconBase>
    );
}

export function IconClock(props: IconProps) {
    return (
        <IconBase {...props}>
            <circle cx='12' cy='12' r='9' />
            <path d='M12 7v5l3 3' />
        </IconBase>
    );
}

export function IconLogOut(props: IconProps) {
    return (
        <IconBase {...props}>
            <path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' />
            <path d='m16 17 5-5-5-5' />
            <path d='M21 12H9' />
        </IconBase>
    );
}

export function IconArrowLeft(props: IconProps) {
    return (
        <IconBase {...props}>
            <path d='M19 12H5' />
            <path d='m12 19-7-7 7-7' />
        </IconBase>
    );
}

export function IconShoppingBag(props: IconProps) {
    return (
        <IconBase {...props}>
            <path d='M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z' />
            <path d='M3 6h18' />
            <path d='M16 10a4 4 0 0 1-8 0' />
        </IconBase>
    );
}

export function IconCalendarDays(props: IconProps) {
    return (
        <IconBase {...props}>
            <rect x='3' y='4' width='18' height='18' rx='2' />
            <path d='M16 2v4M8 2v4M3 10h18' />
        </IconBase>
    );
}
