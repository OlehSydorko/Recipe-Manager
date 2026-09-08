create table if not exists public.recipe_comment_likes (
    comment_id uuid not null references public.recipe_comments (id) on delete cascade,
    user_id uuid not null references auth.users (id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (comment_id, user_id)
);

create index if not exists recipe_comment_likes_comment_id_idx on public.recipe_comment_likes (comment_id);

alter table public.recipe_comment_likes enable row level security;

drop policy if exists "Likes are viewable by anyone" on public.recipe_comment_likes;
create policy "Likes are viewable by anyone"
    on public.recipe_comment_likes for select
    to anon, authenticated
    using (true);

drop policy if exists "Users can like as themselves" on public.recipe_comment_likes;
create policy "Users can like as themselves"
    on public.recipe_comment_likes for insert
    to authenticated
    with check (user_id = auth.uid());

drop policy if exists "Users can unlike as themselves" on public.recipe_comment_likes;
create policy "Users can unlike as themselves"
    on public.recipe_comment_likes for delete
    to authenticated
    using (user_id = auth.uid());
