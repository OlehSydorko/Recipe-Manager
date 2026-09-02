'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { TextLineSkeleton } from '@/components/ui/Skeleton';
import { AddFromRecipeModal } from '@/features/shopping-list/components/AddFromRecipeModal';
import { AddShoppingItemModal } from '@/features/shopping-list/components/AddShoppingItemModal';
import { ShoppingListItemRow } from '@/features/shopping-list/components/ShoppingListItemRow';
import { useClearCheckedShoppingListItems, useShoppingListItems } from '@/hooks/useShoppingList';
import { groupByShoppingSection } from '@/lib/shoppingListGrouping';
import type { ShoppingListItem } from '@/types/shoppingListItem';
import { Check, Plus, ShoppingCart } from 'lucide-react';

type ShoppingListFilter = 'all' | 'remaining';

export function ShoppingListSection() {
    const { data: items, isPending } = useShoppingListItems();
    const clearChecked = useClearCheckedShoppingListItems();

    const [filter, setFilter] = useState<ShoppingListFilter>('all');
    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
    const [isAddFromRecipeModalOpen, setIsAddFromRecipeModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ShoppingListItem | null>(null);

    const totalCount = items?.length ?? 0;
    const remainingCount = items?.filter((item) => !item.is_checked).length ?? 0;
    const hasCheckedItems = items?.some((item) => item.is_checked) ?? false;

    const visibleItems = filter === 'remaining' ? (items ?? []).filter((item) => !item.is_checked) : (items ?? []);
    const groups = groupByShoppingSection(visibleItems);

    const handleEdit = (item: ShoppingListItem) => {
        setEditingItem(item);
        setIsAddItemModalOpen(true);
    };

    const handleCloseItemModal = () => {
        setIsAddItemModalOpen(false);
        setEditingItem(null);
    };

    return (
        <div>
            <div>
                <h1 className='text-display font-semibold text-text-primary'>Shopping List</h1>
                {!isPending && (
                    <p className='mt-1 text-body text-text-secondary'>
                        {totalCount} {totalCount === 1 ? 'item' : 'items'} • {remainingCount} remaining
                    </p>
                )}
            </div>

            <div className='mt-4 grid grid-cols-2 gap-3 sm:max-w-md'>
                <button
                    type='button'
                    onClick={() => setIsAddItemModalOpen(true)}
                    className='flex items-center gap-3 rounded-lg border border-border bg-surface p-4 text-left transition-colors duration-150 hover:bg-hover'
                >
                    <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-muted text-accent'>
                        <Plus size={18} />
                    </span>
                    <span>
                        <span className='block text-button font-medium text-text-primary'>Add Item</span>
                        <span className='block text-caption text-text-secondary'>Add ingredient manually</span>
                    </span>
                </button>

                <button
                    type='button'
                    onClick={() => setIsAddFromRecipeModalOpen(true)}
                    className='flex items-center gap-3 rounded-lg border border-border bg-surface p-4 text-left transition-colors duration-150 hover:bg-hover'
                >
                    <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-muted text-accent'>
                        <ShoppingCart size={18} />
                    </span>
                    <span>
                        <span className='block text-button font-medium text-text-primary'>Add from Recipe</span>
                        <span className='block text-caption text-text-secondary'>Choose a recipe</span>
                    </span>
                </button>
            </div>

            <div className='mt-5 flex items-center justify-end'>
                <div className='inline-flex rounded-md border border-border p-0.5'>
                    <button
                        type='button'
                        onClick={() => setFilter('all')}
                        className={`rounded-sm px-3 py-1.5 text-button font-medium transition-colors duration-150 ${
                            filter === 'all'
                                ? 'bg-accent-muted text-accent'
                                : 'text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        All
                    </button>
                    <button
                        type='button'
                        onClick={() => setFilter('remaining')}
                        className={`rounded-sm px-3 py-1.5 text-button font-medium transition-colors duration-150 ${
                            filter === 'remaining'
                                ? 'bg-accent-muted text-accent'
                                : 'text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        Remaining
                    </button>
                </div>
            </div>

            {isPending && (
                <div className='mt-4 space-y-2'>
                    <TextLineSkeleton className='w-full' />
                    <TextLineSkeleton className='w-5/6' />
                    <TextLineSkeleton className='w-2/3' />
                </div>
            )}

            {!isPending && totalCount === 0 && (
                <div className='mt-16 flex flex-col items-center gap-3 text-center'>
                    <ShoppingCart size={32} className='text-text-disabled' />
                    <p className='text-h3 font-medium text-text-primary'>Your shopping list is empty</p>
                    <p className='max-w-sm text-body text-text-secondary'>
                        Add items by hand, or add all the ingredients from a recipe at once.
                    </p>
                </div>
            )}

            {!isPending && totalCount > 0 && groups.length === 0 && (
                <p className='mt-8 text-center text-body text-text-secondary'>Nothing left to buy.</p>
            )}

            {!isPending && groups.length > 0 && (
                <div className='mt-4 space-y-5'>
                    {groups.map((group) => (
                        <div key={group.section} className='rounded-lg border border-border bg-surface p-2'>
                            <div className='flex items-center justify-between px-2 py-1.5'>
                                <h2 className='text-label font-semibold uppercase tracking-wide text-text-secondary'>
                                    {group.label}
                                </h2>
                                <span className='rounded-full bg-hover px-2 py-0.5 text-caption text-text-secondary'>
                                    {group.items.length}
                                </span>
                            </div>

                            <div className='space-y-0.5'>
                                {group.items.map((item) => (
                                    <ShoppingListItemRow key={item.id} item={item} onEdit={handleEdit} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!isPending && hasCheckedItems && (
                <Button
                    type='button'
                    variant='primary'
                    fullWidth
                    onClick={() => clearChecked.mutate()}
                    disabled={clearChecked.isPending}
                    className='mt-5'
                >
                    <Check size={16} />
                    {clearChecked.isPending ? 'Clearing…' : 'Clear purchased items'}
                </Button>
            )}

            <AddShoppingItemModal open={isAddItemModalOpen} onClose={handleCloseItemModal} item={editingItem} />
            <AddFromRecipeModal open={isAddFromRecipeModalOpen} onClose={() => setIsAddFromRecipeModalOpen(false)} />
        </div>
    );
}
