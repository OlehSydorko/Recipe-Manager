-- Base portion count a recipe's stored ingredient quantities represent
-- (e.g. portions = 2 means the saved ingredient quantities feed 2 people).
-- The Portions changer scales quantities client-side from this baseline —
-- it never writes back to the ingredients table.

alter table public.recipes add column if not exists portions integer not null default 1;

alter table public.recipes add constraint recipes_portions_positive check (portions > 0);
