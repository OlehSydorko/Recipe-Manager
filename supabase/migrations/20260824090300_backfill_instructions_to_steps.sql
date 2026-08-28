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
