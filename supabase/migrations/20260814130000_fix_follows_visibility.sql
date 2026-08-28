drop policy if exists "Users can view follow relationships they're part of" on public.follows;
create policy "Follow relationships are viewable by anyone"
    on public.follows for select
    to anon, authenticated
    using (true);
