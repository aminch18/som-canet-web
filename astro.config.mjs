import {defineConfig} from 'astro/config';
import sitemap from '@astrojs/sitemap';
const base = process.env.BASE_PATH || '/';
const site = process.env.SITE_URL || 'http://127.0.0.1:4321';
if (process.env.PUBLIC_INDEXABLE === 'true' && (!process.env.SITE_URL || !site.startsWith('https://'))) {
  throw new Error('SITE_URL debe ser una URL HTTPS real antes de activar la indexación.');
}
export default defineConfig({
  devToolbar: {enabled: false},
  site, base, output: 'static', trailingSlash: 'always',
  integrations: [sitemap({filter: (url) => !url.includes('/admin/') && !url.endsWith('.html')})],
  vite: {server: {fs: {allow: ['.']}}},
});
