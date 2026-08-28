alter table public.ingredients
    add column if not exists section_id uuid references public.sections (id) on delete set null;

alter table public.steps
    add column if not exists section_id uuid references public.sections (id) on delete set null;

create index if not exists ingredients_section_id_idx on public.ingredients (section_id);
create index if not exists steps_section_id_idx on public.steps (section_id);
