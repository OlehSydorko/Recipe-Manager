-- Whether the user has marked this recipe as a favorite. Purely a user-facing
-- flag, no cascading behavior — surfaced as a star next to the recipe title.
alter table public.recipes add column if not exists is_favorite boolean not null default false;
