'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal/Modal';
import { useAddShoppingListItems, useUpdateShoppingListItem } from '@/hooks/useShoppingList';
import {
    DEFAULT_SHOPPING_SECTION,
    SHOPPING_SECTIONS,
    SHOPPING_SECTION_LABELS,
    type ShoppingListItem,
    type ShoppingSection
} from '@/types/shoppingListItem';
import { ChevronDown } from 'lucide-react';
import styles from './AddShoppingItemModal.module.scss';

type AddShoppingItemModalProps = {
    open: boolean;
    onClose: () => void;
    item: ShoppingListItem | null;
};

export function AddShoppingItemModal({ open, onClose, item }: AddShoppingItemModalProps) {
    const addItems = useAddShoppingListItems();
    const updateItem = useUpdateShoppingListItem();

    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unit, setUnit] = useState('');
    const [section, setSection] = useState<ShoppingSection>(DEFAULT_SHOPPING_SECTION);

    useEffect(() => {
        if (open) {
            setName(item?.name ?? '');
            setQuantity(item?.quantity ?? '');
            setUnit(item?.unit ?? '');
            setSection(item?.section ?? DEFAULT_SHOPPING_SECTION);
        }
    }, [open, item]);

    const isSubmitting = addItems.isPending || updateItem.isPending;

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();

        if (!name.trim()) {
            return;
        }

        if (item) {
            await updateItem.mutateAsync({ id: item.id, name, quantity, section, unit });
        } else {
            await addItems.mutateAsync([{ name, quantity, section, sourceRecipeId: null, unit }]);
        }

        onClose();
    };

    return (
        <Modal open={open} onClose={onClose} title={item ? 'Edit item' : 'Add item'}>
            <form onSubmit={handleSubmit} className='space-y-4'>
                <div>
                    <label htmlFor='shopping-item-name' className={styles.fieldLabel}>
                        Ingredient
                    </label>
                    <Input
                        id='shopping-item-name'
                        type='text'
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        disabled={isSubmitting}
                        required
                    />
                </div>

                <div className='flex gap-3'>
                    <div className='flex-1'>
                        <label htmlFor='shopping-item-quantity' className={styles.fieldLabel}>
                            Amount <span className='font-normal text-text-disabled'>(optional)</span>
                        </label>
                        <Input
                            id='shopping-item-quantity'
                            type='text'
                            inputMode='decimal'
                            value={quantity}
                            onChange={(event) => setQuantity(event.target.value)}
                            placeholder='2'
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className='flex-1'>
                        <label htmlFor='shopping-item-unit' className={styles.fieldLabel}>
                            Unit <span className='font-normal text-text-disabled'>(optional)</span>
                        </label>
                        <Input
                            id='shopping-item-unit'
                            type='text'
                            value={unit}
                            onChange={(event) => setUnit(event.target.value)}
                            placeholder='pcs'
                            disabled={isSubmitting}
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor='shopping-item-section' className={styles.fieldLabel}>
                        Section
                    </label>
                    <div className='relative'>
                        <select
                            id='shopping-item-section'
                            value={section}
                            onChange={(event) => setSection(event.target.value as ShoppingSection)}
                            disabled={isSubmitting}
                            className={styles.select}
                        >
                            {SHOPPING_SECTIONS.map((sectionOption) => (
                                <option key={sectionOption} value={sectionOption}>
                                    {SHOPPING_SECTION_LABELS[sectionOption]}
                                </option>
                            ))}
                        </select>
                        <ChevronDown size={16} className={styles.selectChevron} />
                    </div>
                </div>

                <div className='flex justify-end gap-2 pt-2'>
                    <Button type='button' variant='ghost' onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type='submit' variant='primary' disabled={isSubmitting}>
                        {isSubmitting ? 'Saving…' : 'Save'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
