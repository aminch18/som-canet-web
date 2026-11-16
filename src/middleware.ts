import {defineMiddleware} from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
 if (import.meta.env.EDITOR_PREVIEW !== 'true') return next();

 const {hasPreviewSession, previewCookie} = await import('./lib/preview-session');
 context.locals.editorPreview = hasPreviewSession(
  context.cookies.get(previewCookie)?.value, process.env.SANITY_PREVIEW_TOKEN,
 );
 const response = await next();
 const headers = new Headers(response.headers);
 headers.set('Cache-Control', 'private, no-store');
 headers.set('X-Robots-Tag', 'noindex, nofollow');
 headers.set('Referrer-Policy', 'no-referrer');
 const studioOrigins = (process.env.SANITY_PREVIEW_STUDIO_ORIGINS || '').split(',').flatMap(value => {
  try {
   const url = new URL(value.trim());
   return ['http:', 'https:'].includes(url.protocol) ? [url.origin] : [];
  } catch { return []; }
 });
 headers.set('Content-Security-Policy', `frame-ancestors 'self' ${studioOrigins.join(' ')}`.trim());
 return new Response(response.body, {status:response.status, statusText:response.statusText, headers});
});
