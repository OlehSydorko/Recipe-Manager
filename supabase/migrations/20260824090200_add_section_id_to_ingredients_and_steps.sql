-- Links ingredients and steps to an (optional) section. `section_id` is
-- nullable and defaults to null for every existing row, which is what makes
-- this backward-compatible: every recipe renders exactly as it does today
-- (one flat list, no headings) until its owner explicitly adds a section.
-- `on delete set null` rather than cascade: if a section row is ever removed
-- outside the normal wholesale-replace flow, its ingredients/steps become
-- unsectioned rather than disappearing.

alter table public.ingredients
    add column if not exists section_id uuid references public.sections (id) on delete set null;

alter table public.steps
    add column if not exists section_id uuid references public.sections (id) on delete set null;

create index if not exists ingredients_section_id_idx on public.ingredients (section_id);
create index if not exists steps_section_id_idx on public.steps (section_id);
