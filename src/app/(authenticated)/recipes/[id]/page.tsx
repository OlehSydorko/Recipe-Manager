import { createClient } from '@/lib/supabaseServerClient';
import type { Metadata } from 'next';
import { RecipeDetailClient } from './RecipeDetailClient';

type RecipeDetailPageProps = {
    params: Promise<{ id: string }>;
};

const SITE_NAME = 'Recipe Manager';
const DEFAULT_DESCRIPTION = 'A recipe shared on Recipe Manager.';

export async function generateMetadata({ params }: RecipeDetailPageProps): Promise<Metadata> {
    const { id } = await params;
    const supabase = await createClient();

    const { data: recipe } = await supabase.from('recipes').select('title, description').eq('id', id).maybeSingle();

    if (!recipe) {
        return { title: `Recipe not found | ${SITE_NAME}` };
    }

    return {
        title: `${recipe.title} | ${SITE_NAME}`,
        description: recipe.description || DEFAULT_DESCRIPTION,
        openGraph: {
            title: recipe.title,
            description: recipe.description || DEFAULT_DESCRIPTION,
            type: 'article'
        }
    };
}

export default async function RecipeDetailPage({ params }: RecipeDetailPageProps) {
    const { id } = await params;

    return <RecipeDetailClient id={id} />;
}
