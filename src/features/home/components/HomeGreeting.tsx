'use client';

import { useEffect, useState } from 'react';

type HomeGreetingProps = {
    displayName: string | null;
};

function getTimeOfDayGreeting(hour: number): string {
    if (hour < 12) {
        return 'Good morning';
    }

    if (hour < 18) {
        return 'Good afternoon';
    }

    return 'Good evening';
}

export function HomeGreeting({ displayName }: HomeGreetingProps) {
    const [greeting, setGreeting] = useState('Hello');

    useEffect(() => {
        setGreeting(getTimeOfDayGreeting(new Date().getHours()));
    }, []);

    return (
        <div>
            <h1 className='text-display font-semibold text-text-primary'>
                {greeting}
                {displayName ? `, ${displayName}` : ''}
            </h1>
            <p className='mt-2 text-body text-text-secondary'>What are you cooking today?</p>
        </div>
    );
}
