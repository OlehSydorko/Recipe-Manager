alter table public.recipes add column if not exists portions integer not null default 1;

alter table public.recipes add constraint recipes_portions_positive check (portions > 0);
