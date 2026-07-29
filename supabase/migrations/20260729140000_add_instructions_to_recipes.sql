-- Adds a dedicated instructions field so recipes can store step-by-step cooking
-- instructions separately from the short, optional description. Nullable since
-- existing rows won't have one yet.

alter table public.recipes add column if not exists instructions text;
