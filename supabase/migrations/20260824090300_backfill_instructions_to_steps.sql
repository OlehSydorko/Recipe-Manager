-- One-time data migration: turns each recipe's existing free-text
-- `instructions` into `steps` rows (one per non-blank line, section_id
-- null) so the app can move Instructions from a single text blob to
-- structured, per-section steps without losing existing content.
-- `recipes.instructions` is intentionally left in place (not dropped) —
-- see docs/plans/recipe-sections-plan.md for why.
--
-- Spot-checked against the 8 live recipes before this was written: none of
-- them have embedded newlines in `instructions` (each is either empty or a
-- single paragraph), so this produces exactly one step per non-empty recipe
-- with no line-splitting ambiguity.

do $$
declare
    r record;
    line text;
    idx integer;
begin
    for r in select id, instructions from public.recipes
             where instructions is not null and trim(instructions) <> ''
    loop
        idx := 0;
        foreach line in array regexp_split_to_array(r.instructions, E'\n') loop
            if trim(line) <> '' then
                insert into public.steps (recipe_id, instruction, sort_order)
                values (r.id, trim(line), idx);
                idx := idx + 1;
            end if;
        end loop;
    end loop;
end $$;
