-- Follow relationships become fully public-read: needed so a profile's
-- follower/following counts are correct for any viewer (guest or otherwise),
-- not just the two people in the relationship. The previous policy
-- (follower_id = auth.uid() or followed_id = auth.uid()) already under-counted
-- for third-party viewers before guest access existed -- this fixes that too.
-- Insert/delete stay owner-scoped (a user can still only create/remove their
-- own follow rows).

drop policy if exists "Users can view follow relationships they're part of" on public.follows;
create policy "Follow relationships are viewable by anyone"
    on public.follows for select
    to anon, authenticated
    using (true);
