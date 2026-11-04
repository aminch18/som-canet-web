import {appendFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
export function pagesEnvironment(env) {
  const [owner, repository] = (env.GITHUB_REPOSITORY || '').split('/');
  if (!owner || !repository || !/^[a-z\d-]+$/i.test(owner) || !/^[\w.-]+$/.test(repository)) {
    throw new Error('GITHUB_REPOSITORY must identify the owner/repository.');
  }
  const defaultSite = `https://${owner.toLowerCase()}.github.io`;
  const site = new URL(env.PAGES_SITE_URL || defaultSite);
  if (site.protocol !== 'https:' || site.pathname !== '/' || site.username || site.password || site.search || site.hash) {
    throw new Error('Pages must provide a clean HTTPS origin.');
  }
  const fallback = repository.toLowerCase() === `${owner.toLowerCase()}.github.io` ? '/' : `/${repository}/`;
  const provided = env.PAGES_BASE_PATH;
  const base = provided === undefined ? fallback : `/${provided.replace(/^\/+|\/+$/g, '')}/`.replace(/^\/\/$/, '/');
  if (/[\r\n?#\\]/.test(base) || base.includes('..')) throw new Error('Invalid Pages base path.');
  return {SITE_URL: site.origin, BASE_PATH: base};
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!process.env.GITHUB_ENV) throw new Error('This command runs inside GitHub Actions.');
  const values = pagesEnvironment(process.env);
  appendFileSync(process.env.GITHUB_ENV, Object.entries(values).map(([key,value]) => `${key}=${value}\n`).join(''));
  console.log(`Build target: ${values.SITE_URL}${values.BASE_PATH}`);
}
