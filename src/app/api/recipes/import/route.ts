import { GeminiConfigError, GeminiExtractionError, callGeminiForImageImport } from '@/lib/recipeImport/callGemini';
import { checkAndRecordImport } from '@/lib/recipeImport/rateLimit';
import { createClient } from '@/lib/supabaseServerClient';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMPORT_IMAGES = 5;

function errorResponse(message: string, status: number) {
    return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(request: Request) {
    const supabase = await createClient();

    const {
        data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
        return errorResponse('Not authenticated', 401);
    }

    let formData: FormData;

    try {
        formData = await request.formData();
    } catch {
        return errorResponse('Could not read that request.', 400);
    }

    let allowed: boolean;

    try {
        allowed = await checkAndRecordImport(supabase, user.id, 'image');
    } catch {
        return errorResponse('Something went wrong. Please try again.', 500);
    }

    if (!allowed) {
        return errorResponse('You have reached today’s import limit. Try again tomorrow.', 429);
    }

    return handleImageImport(formData);
}

async function handleImageImport(formData: FormData) {
    const images = formData.getAll('images');

    if (images.length === 0 || !images.every((image): image is File => image instanceof File)) {
        return errorResponse('Please choose at least one photo to import.', 400);
    }

    if (images.length > MAX_IMPORT_IMAGES) {
        return errorResponse(`Please choose at most ${MAX_IMPORT_IMAGES} photos.`, 400);
    }

    for (const image of images) {
        if (!ALLOWED_IMAGE_TYPES.includes(image.type)) {
            return errorResponse('Please choose JPG, PNG, or WEBP images.', 400);
        }

        if (image.size > MAX_IMAGE_BYTES) {
            return errorResponse('Each image must be smaller than 5MB.', 400);
        }
    }

    try {
        const encodedImages = await Promise.all(
            images.map(async (image) => ({
                base64: Buffer.from(await image.arrayBuffer()).toString('base64'),
                mimeType: image.type
            }))
        );
        const extracted = await callGeminiForImageImport(encodedImages);

        return NextResponse.json({ ok: true, data: extracted });
    } catch (error) {
        return geminiErrorResponse(error);
    }
}

function geminiErrorResponse(error: unknown) {
    if (error instanceof GeminiConfigError) {
        return errorResponse(error.message, 500);
    }

    if (error instanceof GeminiExtractionError) {
        return errorResponse(error.message, 502);
    }

    return errorResponse('Something went wrong. Please try again.', 500);
}
