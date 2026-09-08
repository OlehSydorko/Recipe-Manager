import type { CommentNode, CommentWithMeta } from '@/types/comment';

function byCreatedAtAsc(a: CommentNode, b: CommentNode): number {
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
}

function byCreatedAtDesc(a: CommentNode, b: CommentNode): number {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

function sortRepliesRecursively(node: CommentNode): void {
    node.replies.sort(byCreatedAtAsc);
    node.replies.forEach(sortRepliesRecursively);
}

export function buildCommentTree(comments: CommentWithMeta[]): CommentNode[] {
    const nodesById = new Map<string, CommentNode>();

    for (const comment of comments) {
        nodesById.set(comment.id, { ...comment, replies: [] });
    }

    const roots: CommentNode[] = [];

    for (const comment of comments) {
        const node = nodesById.get(comment.id);

        if (!node) {
            continue;
        }

        const parent = comment.parent_id ? nodesById.get(comment.parent_id) : null;

        if (parent) {
            parent.replies.push(node);
        } else {
            // top-level review, or a reply whose parent isn't in this batch — surface it
            // as a root rather than silently dropping it
            roots.push(node);
        }
    }

    roots.forEach(sortRepliesRecursively);
    roots.sort(byCreatedAtDesc);

    return roots;
}
