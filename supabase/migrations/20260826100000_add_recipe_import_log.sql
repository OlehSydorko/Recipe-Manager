create table if not exists public.recipe_import_log (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    mode text not null check (mode in ('url', 'image')),
    created_at timestamptz not null default now()
);

create index if not exists recipe_import_log_user_id_created_at_idx
    on public.recipe_import_log (user_id, created_at desc);

alter table public.recipe_import_log enable row level security;

create policy "Users can view their own import log"
    on public.recipe_import_log for select
    using (auth.uid() = user_id);

create policy "Users can insert their own import log rows"
    on public.recipe_import_log for insert
    with check (auth.uid() = user_id);
