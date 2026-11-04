import type {APIRoute} from 'astro';import {isIndexable} from '../lib/content';
export const GET:APIRoute=({site})=>new Response(isIndexable()?`User-agent: *\nAllow: /\nSitemap: ${new URL(import.meta.env.BASE_URL.replace(/\/$/,'')+'/sitemap-index.xml',site).href}\n`:'User-agent: *\nDisallow: /\n',{headers:{'Content-Type':'text/plain; charset=utf-8'}});
