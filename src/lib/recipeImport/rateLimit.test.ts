import { describe, expect, it, vi } from 'vitest';
import { DAILY_IMPORT_LIMIT, checkAndRecordImport } from './rateLimit';

type ChainResult = { count?: number | null; error?: unknown };

function createChain(result: ChainResult) {
    const chain = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        gte: vi.fn(() => chain),
        insert: vi.fn(async () => ({ error: null })),
        then: (resolve: (value: ChainResult) => void) => resolve(result)
    };

    return chain;
}

describe('checkAndRecordImport', () => {
    it('rejects without inserting once the daily cap is reached', async () => {
        const chain = createChain({ count: DAILY_IMPORT_LIMIT, error: null });
        const supabase = { from: vi.fn(() => chain) };

        const allowed = await checkAndRecordImport(supabase as never, 'user-1', 'image');

        expect(allowed).toBe(false);
        expect(chain.insert).not.toHaveBeenCalled();
    });

    it('inserts a row and allows the import when under the cap', async () => {
        const chain = createChain({ count: 3, error: null });
        const supabase = { from: vi.fn(() => chain) };

        const allowed = await checkAndRecordImport(supabase as never, 'user-1', 'image');

        expect(allowed).toBe(true);
        expect(chain.insert).toHaveBeenCalledWith({ mode: 'image', user_id: 'user-1' });
    });

    it('propagates a count error', async () => {
        const chain = createChain({ count: null, error: new Error('db down') });
        const supabase = { from: vi.fn(() => chain) };

        await expect(checkAndRecordImport(supabase as never, 'user-1', 'image')).rejects.toThrow('db down');
    });
});
