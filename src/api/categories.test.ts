import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCategory, deleteCategory, getCategories } from './categories';

type ChainResult = {
    data?: unknown;
    error?: unknown;
    count?: number | null;
};

// A minimal stand-in for the Supabase query builder: every filter/order
// method returns itself so calls can be chained, and the chain is awaitable
// (implements `then`) so `await supabase.from(...).select(...)` resolves to
// whatever result this particular call was set up to return.
function createChain(result: ChainResult) {
    const chain = {
        select: vi.fn(() => chain),
        insert: vi.fn(() => chain),
        delete: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        order: vi.fn(() => chain),
        limit: vi.fn(() => chain),
        single: vi.fn(async () => result),
        then: (resolve: (value: ChainResult) => void) => resolve(result)
    };

    return chain;
}

const mockFrom = vi.fn();
const mockGetUser = vi.fn();

vi.mock('@/lib/supabaseClient', () => ({
    createClient: () => ({
        auth: { getUser: mockGetUser },
        from: mockFrom
    })
}));

beforeEach(() => {
    mockFrom.mockReset();
    mockGetUser.mockReset();
});

describe('getCategories', () => {
    it('returns the categories for the current user', async () => {
        const categories = [{ id: 'cat-1', user_id: 'user-1', name: 'Breakfast', created_at: '2026-01-01' }];

        mockFrom.mockReturnValueOnce(createChain({ data: categories, error: null }));

        await expect(getCategories()).resolves.toEqual(categories);
        expect(mockFrom).toHaveBeenCalledWith('categories');
    });

    it('throws when Supabase returns an error', async () => {
        mockFrom.mockReturnValueOnce(createChain({ data: null, error: new Error('network down') }));

        await expect(getCategories()).rejects.toThrow('network down');
    });
});

describe('createCategory', () => {
    it('throws when there is no authenticated user', async () => {
        mockGetUser.mockResolvedValueOnce({ data: { user: null } });

        await expect(createCategory('Snacks')).rejects.toThrow('Not authenticated');
    });

    it('inserts the category scoped to the current user', async () => {
        mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });

        const created = { id: 'cat-2', user_id: 'user-1', name: 'Snacks', created_at: '2026-08-05' };
        const chain = createChain({ data: created, error: null });

        mockFrom.mockReturnValueOnce(chain);

        await expect(createCategory('Snacks')).resolves.toEqual(created);
        expect(chain.insert).toHaveBeenCalledWith({ name: 'Snacks', user_id: 'user-1' });
    });
});

describe('deleteCategory', () => {
    const authenticatedUser = { data: { user: { id: 'user-1' } } };

    it('refuses to delete a default category', async () => {
        mockGetUser.mockResolvedValueOnce(authenticatedUser);
        mockFrom.mockReturnValueOnce(createChain({ data: [{ id: 'default-1' }], error: null }));

        await expect(deleteCategory('default-1')).rejects.toThrow('Default categories cannot be deleted.');
    });

    it('refuses to delete a category that still has recipes', async () => {
        mockGetUser.mockResolvedValueOnce(authenticatedUser);
        mockFrom
            .mockReturnValueOnce(createChain({ data: [{ id: 'default-1' }], error: null }))
            .mockReturnValueOnce(createChain({ count: 2, error: null }));

        await expect(deleteCategory('cat-2')).rejects.toThrow(
            'This category still has recipes in it. Move or delete them first.'
        );
    });

    it('deletes a category with no recipes left in it', async () => {
        mockGetUser.mockResolvedValueOnce(authenticatedUser);

        const deleteChain = createChain({ error: null });

        mockFrom
            .mockReturnValueOnce(createChain({ data: [{ id: 'default-1' }], error: null }))
            .mockReturnValueOnce(createChain({ count: 0, error: null }))
            .mockReturnValueOnce(deleteChain);

        await deleteCategory('cat-2');

        expect(deleteChain.delete).toHaveBeenCalled();
        expect(deleteChain.eq).toHaveBeenCalledWith('id', 'cat-2');
    });
});
