import { describe, expect, it, vi } from 'vitest';
import { DAILY_IMPORT_LIMIT, hasImportQuota, recordImport } from './rateLimit';

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

describe('hasImportQuota', () => {
    it('is false once the daily cap is reached', async () => {
        const chain = createChain({ count: DAILY_IMPORT_LIMIT, error: null });
        const supabase = { from: vi.fn(() => chain) };

        const allowed = await hasImportQuota(supabase as never, 'user-1');

        expect(allowed).toBe(false);
    });

    it('is true when under the cap', async () => {
        const chain = createChain({ count: 3, error: null });
        const supabase = { from: vi.fn(() => chain) };

        const allowed = await hasImportQuota(supabase as never, 'user-1');

        expect(allowed).toBe(true);
    });

    it('propagates a count error', async () => {
        const chain = createChain({ count: null, error: new Error('db down') });
        const supabase = { from: vi.fn(() => chain) };

        await expect(hasImportQuota(supabase as never, 'user-1')).rejects.toThrow('db down');
    });
});

describe('recordImport', () => {
    it('inserts a log row for the given user and mode', async () => {
        const chain = createChain({});
        const supabase = { from: vi.fn(() => chain) };

        await recordImport(supabase as never, 'user-1', 'image');

        expect(chain.insert).toHaveBeenCalledWith({ mode: 'image', user_id: 'user-1' });
    });

    it('propagates an insert error', async () => {
        const chain = createChain({});

        chain.insert = vi.fn(async () => ({ error: new Error('insert failed') }));

        const supabase = { from: vi.fn(() => chain) };

        await expect(recordImport(supabase as never, 'user-1', 'image')).rejects.toThrow('insert failed');
    });
});
