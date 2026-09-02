'use client';

import { ActionMenu } from '@/components/ui/ActionMenu';
import { useDeleteShoppingListItem, useSetShoppingListItemChecked } from '@/hooks/useShoppingList';
import type { ShoppingListItem } from '@/types/shoppingListItem';
import { Check } from 'lucide-react';

type ShoppingListItemRowProps = {
    item: ShoppingListItem;
    onEdit: (item: ShoppingListItem) => void;
};

export function ShoppingListItemRow({ item, onEdit }: ShoppingListItemRowProps) {
    const setChecked = useSetShoppingListItemChecked();
    const deleteItem = useDeleteShoppingListItem();

    const handleToggle = () => {
        setChecked.mutate({ id: item.id, isChecked: !item.is_checked });
    };

    return (
        <div
            className={`flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors duration-150 hover:bg-hover ${
                item.is_checked ? 'bg-hover' : ''
            }`}
        >
            <label className='flex flex-1 cursor-pointer items-center gap-3 text-body'>
                <span className='relative flex h-5 w-5 shrink-0 items-center justify-center'>
                    <input type='checkbox' checked={item.is_checked} onChange={handleToggle} className='sr-only' />
                    <span
                        className={`h-5 w-5 rounded-sm border transition-colors duration-150 ${
                            item.is_checked ? 'border-accent bg-accent' : 'border-border-strong'
                        }`}
                    />
                    {item.is_checked && (
                        <Check size={13} className='animate-check-pop absolute inset-0 m-auto text-accent-foreground' />
                    )}
                </span>

                {(item.quantity || item.unit) && (
                    <span
                        className={`text-button font-mono ${item.is_checked ? 'text-text-disabled' : 'text-text-secondary'}`}
                    >
                        {item.quantity ? `${item.quantity} ` : ''}
                        {item.unit ?? ''}
                    </span>
                )}

                <span className={item.is_checked ? 'text-text-disabled line-through' : 'text-text-primary'}>
                    {item.name}
                </span>
            </label>

            <ActionMenu
                ariaLabel={`Actions for ${item.name}`}
                items={[
                    { label: 'Edit', onSelect: () => onEdit(item) },
                    { label: 'Delete', onSelect: () => deleteItem.mutate(item.id), variant: 'danger' }
                ]}
            />
        </div>
    );
}
