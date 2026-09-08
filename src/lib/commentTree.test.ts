import { describe, expect, it } from 'vitest';
import { buildCommentTree } from './commentTree';
import type { CommentWithMeta } from '@/types/comment';

const AUTHOR = { avatarUrl: null, displayName: 'Dana', id: 'u1' };

function makeComment(overrides: Partial<CommentWithMeta>): CommentWithMeta {
    return {
        author: AUTHOR,
        body: 'hi',
        created_at: '2026-09-01T00:00:00.000Z',
        id: 'c1',
        likeCount: 0,
        likedByMe: false,
        parent_id: null,
        rating: null,
        recipe_id: 'r1',
        updated_at: '2026-09-01T00:00:00.000Z',
        user_id: 'u1',
        ...overrides
    };
}

describe('buildCommentTree', () => {
    it('returns top-level reviews with no replies', () => {
        const comments = [
            makeComment({ id: 'a', rating: 5 }),
            makeComment({ id: 'b', created_at: '2026-09-02T00:00:00.000Z', rating: 4 })
        ];

        const tree = buildCommentTree(comments);

        expect(tree).toHaveLength(2);
        expect(tree.every((node) => node.replies.length === 0)).toBe(true);
    });

    it('sorts top-level reviews newest first', () => {
        const comments = [
            makeComment({ id: 'older', created_at: '2026-09-01T00:00:00.000Z', rating: 5 }),
            makeComment({ id: 'newer', created_at: '2026-09-03T00:00:00.000Z', rating: 3 })
        ];

        const tree = buildCommentTree(comments);

        expect(tree.map((node) => node.id)).toEqual(['newer', 'older']);
    });

    it('nests a reply under its parent review', () => {
        const comments = [
            makeComment({ id: 'review', rating: 5 }),
            makeComment({
                created_at: '2026-09-01T01:00:00.000Z',
                id: 'reply',
                parent_id: 'review',
                rating: null
            })
        ];

        const tree = buildCommentTree(comments);

        expect(tree).toHaveLength(1);
        expect(tree[0].replies).toHaveLength(1);
        expect(tree[0].replies[0].id).toBe('reply');
    });

    it('nests a reply-to-a-reply arbitrarily deep', () => {
        const comments = [
            makeComment({ id: 'review', rating: 5 }),
            makeComment({ created_at: '2026-09-01T01:00:00.000Z', id: 'reply-1', parent_id: 'review' }),
            makeComment({ created_at: '2026-09-01T02:00:00.000Z', id: 'reply-2', parent_id: 'reply-1' })
        ];

        const tree = buildCommentTree(comments);

        expect(tree[0].replies[0].replies[0].id).toBe('reply-2');
    });

    it('orders replies under a parent oldest first', () => {
        const comments = [
            makeComment({ id: 'review', rating: 5 }),
            makeComment({ created_at: '2026-09-01T02:00:00.000Z', id: 'later', parent_id: 'review' }),
            makeComment({ created_at: '2026-09-01T01:00:00.000Z', id: 'earlier', parent_id: 'review' })
        ];

        const tree = buildCommentTree(comments);

        expect(tree[0].replies.map((node) => node.id)).toEqual(['earlier', 'later']);
    });

    it('surfaces an orphaned reply as a root instead of dropping it', () => {
        const comments = [makeComment({ id: 'orphan', parent_id: 'missing-parent' })];

        const tree = buildCommentTree(comments);

        expect(tree).toHaveLength(1);
        expect(tree[0].id).toBe('orphan');
    });

    it('returns an empty array for no comments', () => {
        expect(buildCommentTree([])).toEqual([]);
    });
});
