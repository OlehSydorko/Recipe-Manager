alter table public.recipes add column if not exists is_favorite boolean not null default false;
