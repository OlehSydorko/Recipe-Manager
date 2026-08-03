'use client';

import { formatRelativeTime } from '@/lib/relativeTime';
import type { ActivityItem, ActivityType } from '@/types/activity';
import { BookOpen, Folder, Heart, UserPlus } from 'lucide-react';
import Link from 'next/link';

type ActivityFeedProps = {
    items: ActivityItem[];
};

const ICON_BY_TYPE: Record<ActivityType, typeof BookOpen> = {
    collection_created: Folder,
    followed_user: UserPlus,
    recipe_created: BookOpen,
    recipe_favorited: Heart
};

function describeActivity(item: ActivityItem): string {
    switch (item.type) {
        case 'recipe_created':
            return `Created "${item.recipeTitle ?? 'a recipe'}"`;
        case 'recipe_favorited':
            return `Favorited "${item.recipeTitle ?? 'a recipe'}"`;
        case 'followed_user':
            return `Followed ${item.targetDisplayName ?? 'someone'}`;
        case 'collection_created':
            return 'Created a new collection';
        default:
            return '';
    }
}

function getActivityHref(item: ActivityItem): string | null {
    if ((item.type === 'recipe_created' || item.type === 'recipe_favorited') && item.recipeId) {
        return `/recipes/${item.recipeId}`;
    }

    if (item.type === 'followed_user' && item.targetUserId) {
        return `/profile/${item.targetUserId}`;
    }

    return null;
}

export function ActivityFeed({ items }: ActivityFeedProps) {
    return (
        <ul className='mt-6 space-y-2'>
            {items.map((item) => {
                const Icon = ICON_BY_TYPE[item.type];
                const href = getActivityHref(item);

                const rowContent = (
                    <>
                        <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-muted text-accent'>
                            <Icon size={16} />
                        </span>
                        <span className='min-w-0 flex-1'>
                            <span className='block text-body text-text-primary'>{describeActivity(item)}</span>
                            <span className='block text-caption text-text-secondary'>
                                {formatRelativeTime(item.created_at)}
                            </span>
                        </span>
                    </>
                );

                return (
                    <li key={item.id} className='rounded-lg border border-border bg-surface p-3'>
                        {href ? (
                            <Link href={href} className='flex items-center gap-3'>
                                {rowContent}
                            </Link>
                        ) : (
                            <div className='flex items-center gap-3'>{rowContent}</div>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}
