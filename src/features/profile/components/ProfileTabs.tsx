'use client';

export type ProfileTabId = 'my-recipes' | 'favorites' | 'collections' | 'activity';

const TABS: { id: ProfileTabId; label: string }[] = [
    { id: 'my-recipes', label: 'My Recipes' },
    { id: 'favorites', label: 'Favorites' },
    { id: 'collections', label: 'Collections' },
    { id: 'activity', label: 'Activity' }
];

type ProfileTabsProps = {
    activeTab: ProfileTabId;
    onChange: (tab: ProfileTabId) => void;
};

export function ProfileTabs({ activeTab, onChange }: ProfileTabsProps) {
    return (
        <div role='tablist' aria-label='Profile sections' className='flex flex-wrap gap-2 border-b border-border pb-3'>
            {TABS.map((tab) => {
                const isActive = tab.id === activeTab;

                return (
                    <button
                        key={tab.id}
                        type='button'
                        role='tab'
                        aria-selected={isActive}
                        onClick={() => onChange(tab.id)}
                        className={`rounded-md px-4 py-2.5 text-button font-medium transition-colors duration-150 ${
                            isActive
                                ? 'border border-accent bg-accent-muted text-accent'
                                : 'border border-transparent text-text-secondary hover:bg-hover hover:text-text-primary'
                        }`}
                    >
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}
