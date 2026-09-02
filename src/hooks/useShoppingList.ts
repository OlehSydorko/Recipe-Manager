import {
    type AddShoppingListItemsInput,
    type UpdateShoppingListItemInput,
    addShoppingListItems,
    clearCheckedShoppingListItems,
    deleteShoppingListItem,
    getShoppingListItems,
    setShoppingListItemChecked,
    updateShoppingListItem
} from '@/api/shoppingList';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const SHOPPING_LIST_QUERY_KEY = ['shopping-list'];

export function useShoppingListItems() {
    return useQuery({
        queryFn: getShoppingListItems,
        queryKey: SHOPPING_LIST_QUERY_KEY
    });
}

export function useAddShoppingListItems() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (inputs: AddShoppingListItemsInput[]) => addShoppingListItems(inputs),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: SHOPPING_LIST_QUERY_KEY });
        }
    });
}

export function useUpdateShoppingListItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: UpdateShoppingListItemInput) => updateShoppingListItem(input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: SHOPPING_LIST_QUERY_KEY });
        }
    });
}

type SetCheckedInput = {
    id: string;
    isChecked: boolean;
};

export function useSetShoppingListItemChecked() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, isChecked }: SetCheckedInput) => setShoppingListItemChecked(id, isChecked),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: SHOPPING_LIST_QUERY_KEY });
        }
    });
}

export function useDeleteShoppingListItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteShoppingListItem(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: SHOPPING_LIST_QUERY_KEY });
        }
    });
}

export function useClearCheckedShoppingListItems() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: clearCheckedShoppingListItems,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: SHOPPING_LIST_QUERY_KEY });
        }
    });
}
