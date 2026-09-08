create table if not exists public.recipe_comments (
    id uuid primary key default gen_random_uuid(),
    recipe_id uuid not null references public.recipes (id) on delete cascade,
    user_id uuid not null references auth.users (id) on delete cascade,
    parent_id uuid references public.recipe_comments (id) on delete cascade,
    rating smallint check (rating between 1 and 5),
    body text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint recipe_comments_rating_shape check (
        (parent_id is null and rating is not null) or (parent_id is not null and rating is null)
    ),
    constraint recipe_comments_reply_has_body check (parent_id is null or body is not null)
);

create unique index if not exists recipe_comments_one_review_per_user
    on public.recipe_comments (recipe_id, user_id)
    where parent_id is null;

create index if not exists recipe_comments_recipe_id_idx on public.recipe_comments (recipe_id);
create index if not exists recipe_comments_parent_id_idx on public.recipe_comments (parent_id);

alter table public.recipe_comments enable row level security;

drop policy if exists "Comments are viewable by anyone" on public.recipe_comments;
create policy "Comments are viewable by anyone"
    on public.recipe_comments for select
    to anon, authenticated
    using (true);

drop policy if exists "Users can post their own comments" on public.recipe_comments;
create policy "Users can post their own comments"
    on public.recipe_comments for insert
    to authenticated
    with check (
        user_id = auth.uid()
        and (parent_id is not null or not owns_recipe(recipe_id))
        and (
            parent_id is null
            or exists (
                select 1 from public.recipe_comments p
                where p.id = parent_id and p.recipe_id = recipe_id
            )
        )
    );

drop policy if exists "Users can edit their own comments" on public.recipe_comments;
create policy "Users can edit their own comments"
    on public.recipe_comments for update
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

drop policy if exists "Authors and recipe owners can delete comments" on public.recipe_comments;
create policy "Authors and recipe owners can delete comments"
    on public.recipe_comments for delete
    to authenticated
    using (user_id = auth.uid() or owns_recipe(recipe_id));
