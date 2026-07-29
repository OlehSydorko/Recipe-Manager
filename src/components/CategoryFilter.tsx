import type { Category } from '@/types/category';

type CategoryFilterProps = {
    categories: Category[] | undefined;
    value: string;
    onChange: (categoryId: string) => void;
};

export function CategoryFilter({ categories, value, onChange }: CategoryFilterProps) {
    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        onChange(event.target.value);
    };

    return (
        <select
            aria-label='Filter by category'
            value={value}
            onChange={handleChange}
            className='rounded border px-3 py-2 text-sm'
        >
            <option value=''>All categories</option>
            {categories?.map((category) => (
                <option key={category.id} value={category.id}>
                    {category.name}
                </option>
            ))}
        </select>
    );
}
