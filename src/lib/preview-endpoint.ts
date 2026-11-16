import type { APIRoute } from 'astro';
import { createClient } from '@sanity/client';
import { validatePreviewUrl, urlSearchParamPreviewSecret } from '@sanity/preview-url-secret';
import { createPreviewSession, previewCookie, previewLifetime } from './preview-session';

export const GET: APIRoute = async ({ request, url, cookies, redirect }) => {
    const token = process.env.SANITY_PREVIEW_TOKEN;
    const projectId = import.meta.env.SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID;
    if (!token || !projectId) return new Response('Vista prèvia sense configurar.', { status: 503 });
    if (!url.searchParams.get(urlSearchParamPreviewSecret)) return new Response(null, { status: 401 });

    const client = createClient({
        projectId,
        dataset: import.meta.env.SANITY_DATASET || process.env.SANITY_DATASET || 'production',
        token, apiVersion: '2026-11-01', useCdn: false,
    });
    const result = await validatePreviewUrl(client, request.url).catch(() => null);
    const studioOrigins = (process.env.SANITY_PREVIEW_STUDIO_ORIGINS || '')
        .split(',').map(origin => origin.trim()).filter(Boolean);
    if (!result?.isValid || !result.studioOrigin || !studioOrigins.includes(result.studioOrigin))
        return new Response('Torna a obrir la vista prèvia des de Studio.', { status: 401 });
    const target = new URL(result.redirectTo || '/', url);
    const location = target.origin === url.origin && !target.pathname.startsWith('//') ? target.pathname : '/';
    cookies.set(previewCookie, createPreviewSession(token), {
        path: '/', httpOnly: true, secure: true, sameSite: 'none', partitioned: true, maxAge: previewLifetime,
    });
    return redirect(location, 303);
};
