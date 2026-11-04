import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';import {JSDOM} from 'jsdom';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.resolve(process.argv[2]||path.join(root,'dist'));
async function allFiles(dir){const files=[];for(const e of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())files.push(...await allFiles(p));else files.push(p);}return files;}
const files=await allFiles(out);const fileSet=new Set(files);const errors=[];let pages=0;let redirects=0;let refs=0;
const home=new JSDOM(await fs.readFile(path.join(out,'index.html'),'utf8')).window.document;
const site=new URL(home.querySelector('link[rel="canonical"]').href);const base=site.pathname.replace(/\/$/,'');
for(const file of files.filter(f=>f.endsWith('.html'))){
 const doc=new JSDOM(await fs.readFile(file,'utf8')).window.document;
 if(doc.querySelector('meta[http-equiv="refresh"]'))redirects++;
 else {
  pages++;
  if(doc.querySelectorAll('h1').length!==1)errors.push(file+': needs one H1');
  if(!doc.title||!doc.querySelector('meta[name="description"]')?.content)errors.push(file+': missing metadata');
  if(!doc.querySelector('link[rel="canonical"]'))errors.push(file+': missing canonical');
  if(!doc.querySelector('meta[name="robots"]'))errors.push(file+': missing indexing policy');
  for(const script of doc.querySelectorAll('script[type="application/ld+json"]')){try{JSON.parse(script.textContent);}catch{errors.push(file+': invalid JSON-LD');}}
 }
 for(const element of doc.querySelectorAll('[href],[src]')){
  const value=element.getAttribute('href')||element.getAttribute('src');
  if(!value||value.startsWith('#')||/^(mailto:|tel:|data:)/.test(value))continue;
  const current=new URL(path.relative(out,file).replaceAll(path.sep,'/'),site);
  const url=new URL(value,current);
  if(url.origin!==site.origin)continue;
  refs++;
  if(base&&!url.pathname.startsWith(base+'/')&&url.pathname!==base){errors.push(file+': path escapes base '+value);continue;}
  const target=decodeURIComponent(url.pathname.slice(base.length)).replace(/^\//,'');
  const resolved=path.join(out,target);
  if(!fileSet.has(resolved)&&!fileSet.has(path.join(resolved,'index.html')))errors.push(file+': missing '+value);
 }
}
if(!fileSet.has(path.join(out,'sitemap-index.xml'))||!fileSet.has(path.join(out,'robots.txt')))errors.push('Missing sitemap or robots.txt');
if(errors.length){console.error(errors.slice(0,30).join('\n'));throw new Error(`${errors.length} build validation failures`);}
console.log(`Validated ${pages} content pages, ${redirects} legacy redirects and ${refs} local references. Base: ${base||'/'}`);
