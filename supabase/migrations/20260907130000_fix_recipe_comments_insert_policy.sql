-- Two bugs fixed here:
-- 1. The reply-parent exists() check compared the subquery's own columns to
--    themselves (bare `parent_id`/`recipe_id` inside a subquery selecting from
--    the same table resolve to that subquery's own row, not the new row being
--    inserted), so it was nearly always false and every reply was rejected
--    with 403 regardless of who posted it.
-- 2. Per explicit product decision: recipe owners can now rate/review/reply on
--    their own recipes too (the earlier "no self-review" restriction is removed).
drop policy if exists "Users can post their own comments" on public.recipe_comments;
create policy "Users can post their own comments"
    on public.recipe_comments for insert
    to authenticated
    with check (
        user_id = auth.uid()
        and (
            parent_id is null
            or exists (
                select 1 from public.recipe_comments p
                where p.id = recipe_comments.parent_id and p.recipe_id = recipe_comments.recipe_id
            )
        )
    );
