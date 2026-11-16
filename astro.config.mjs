import {defineConfig} from 'astro/config';
import node from '@astrojs/node';
import {fileURLToPath} from 'node:url';
import sitemap from '@astrojs/sitemap';
const editorial = process.env.EDITOR_PREVIEW === 'true';
const base = editorial ? '/' : process.env.BASE_PATH || '/';
const site = process.env.SITE_URL || 'http://127.0.0.1:4321';
if (process.env.PUBLIC_INDEXABLE === 'true' && (!process.env.SITE_URL || !site.startsWith('https://'))) {
  throw new Error('SITE_URL debe ser una URL HTTPS real antes de activar la indexación.');
}
export default defineConfig({
  devToolbar: {enabled: false},
  site, base, output: editorial ? 'server' : 'static', ...(editorial ? {adapter: node({mode:'standalone'})} : {}), trailingSlash: 'always',
  integrations: editorial ? [{
    name: 'som-canet-editorial-preview',
    hooks: {'astro:config:setup': ({injectRoute}) => injectRoute({
      pattern:'/api/editor-preview', entrypoint:fileURLToPath(new URL('./src/lib/preview-endpoint.ts', import.meta.url)),
    })},
  }] : [sitemap({filter: (url) => !url.includes('/admin/') && !url.endsWith('.html')})],
  vite: {define:{'import.meta.env.EDITOR_PREVIEW':JSON.stringify(String(editorial))},server: {fs: {allow: ['.']}}},
});
