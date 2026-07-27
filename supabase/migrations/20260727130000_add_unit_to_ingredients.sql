-- Adds a unit-of-measurement field so an ingredient row is quantity + unit + name,
-- e.g. "2" / "cups" / "flour". Nullable since existing rows won't have one yet.

alter table public.ingredients add column if not exists unit text;
