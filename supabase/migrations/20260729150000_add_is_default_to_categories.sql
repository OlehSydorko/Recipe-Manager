-- Distinguishes the 6 categories seeded by the signup trigger from ones a user
-- creates later, so the UI can hide the delete control on defaults and the
-- database refuses to delete them even via a direct API call.

alter table categories
  add column if not exists is_default boolean not null default false;

-- Backfill existing seeded categories.
-- IMPORTANT: fill in the actual 6 default category names below before running
-- this migration. They aren't tracked anywhere in this repo — the seeding
-- trigger lives only in the Supabase project itself (see CLAUDE.md).
update categories
set is_default = true
where name in (
  'REPLACE_ME_1',
  'REPLACE_ME_2',
  'REPLACE_ME_3',
  'REPLACE_ME_4',
  'REPLACE_ME_5',
  'REPLACE_ME_6'
);

-- Enforce at the database level so a default category can't be deleted even
-- if the UI guard is bypassed.
create or replace function prevent_default_category_delete()
returns trigger as $$
begin
  if old.is_default then
    raise exception 'Default categories cannot be deleted';
  end if;

  return old;
end;
$$ language plpgsql;

drop trigger if exists trg_prevent_default_category_delete on categories;

create trigger trg_prevent_default_category_delete
  before delete on categories
  for each row
  execute function prevent_default_category_delete();

-- NOTE: the signup trigger that seeds the 6 default categories also needs to
-- set is_default = true on those inserts going forward. That trigger isn't in
-- this repo's migrations, so update it directly in the Supabase SQL editor.
