import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import {fileURLToPath} from 'node:url';import {spawnSync} from 'node:child_process';import {JSDOM} from 'jsdom';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('new content builds its own route, homepage, archive, SEO and sitemap under a GitHub Pages base',async()=>{
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'som-canet-publishing-'));
 try{
  const docs=JSON.parse(await fs.readFile(path.join(root,'data/content.json'),'utf8'));
  const post={_id:'editorial-test',_type:'post',title:'Una notícia nova de prova',slug:{current:'noticia-nova-de-prova'},summary:'Resum editorial de prova',publishedAt:'2026-11-04T12:00:00Z',historical:false,category:'actualitat',body:[{_type:'block',_key:'p1',style:'normal',markDefs:[{_type:'link',_key:'unsafe',href:'javascript:alert(1)'}],children:[{_type:'span',_key:'s1',text:'Text editorial sense tocar cap plantilla.',marks:['unsafe']}]}]};
  const replaced=docs.find(d=>d._type==='publication');replaced.file={asset:{_ref:'file-new'}};replaced.renderedFileRef='file-old';
  docs.push(post,{...post,_id:'drafts.hidden-test',slug:{current:'unpublished-article'},title:'Unpublished draft'}, {_id:'new-page-test',_type:'page',title:'Pàgina nova',slug:{current:'pagina-nova'},section:'projecte',summary:'Pàgina editable nova',body:post.body});
  const fixture=path.join(temp,'content.json');const out=path.join(temp,'dist');await fs.writeFile(fixture,JSON.stringify(docs));
  const result=spawnSync(process.execPath,[path.join(root,'node_modules/astro/bin/astro.mjs'),'build','--outDir',out],{cwd:root,encoding:'utf8',env:{...process.env,ASTRO_TELEMETRY_DISABLED:'1',CONTENT_SOURCE:'local',CONTENT_FIXTURE:fixture,SITE_URL:'https://example.org',BASE_PATH:'/som-canet/',PUBLIC_INDEXABLE:'true'}});
  assert.equal(result.status,0,result.stdout+'\n'+result.stderr);
  const parse=async file=>new JSDOM(await fs.readFile(path.join(out,file),'utf8')).window.document;
  const article=await parse('articles/noticia-nova-de-prova/index.html');
  assert.equal(article.querySelector('h1').textContent,post.title);assert(article.querySelector('.prose').textContent.includes('sense tocar cap plantilla'));
  assert.equal(article.querySelector('link[rel=canonical]').href,'https://example.org/som-canet/articles/noticia-nova-de-prova/');
  assert.equal(article.querySelector('meta[name=robots]').content,'index,follow');assert.equal(article.querySelectorAll('a[href^="javascript:"]').length,0);
  const schemas=[...article.querySelectorAll('script[type="application/ld+json"]')].map(s=>JSON.parse(s.textContent));assert(schemas.some(s=>s['@type']==='Article'));
  const home=await parse('index.html');assert(home.querySelector('main').textContent.includes(post.title));assert.equal(home.querySelector('.home-feed .eyebrow').textContent,'ACTUALITAT');
  const archive=await parse('arxiu/index.html');assert(archive.querySelector('main').textContent.includes(post.title));
  assert((await fs.readFile(path.join(out,'sitemap-0.xml'),'utf8')).includes('/som-canet/articles/noticia-nova-de-prova/'));
  assert(!(await fs.readFile(path.join(out,'sitemap-0.xml'),'utf8')).includes('unpublished-article'));
  await parse('pagina-nova/index.html');
  const replacedReader=await parse(`documents/${replaced.slug.current}/index.html`);assert.equal(replacedReader.querySelector('.pdf-reader'),null);assert(replacedReader.querySelector('.pdf-viewer'));assert.equal(replacedReader.querySelector('.document-transcript'),null);
  const redirect=await parse('entrada-01.html');assert(redirect.querySelector('meta[http-equiv=refresh]').content.includes('/som-canet/articles/'));
  const validation=spawnSync(process.execPath,[path.join(root,'scripts/validate-build.mjs'),out],{cwd:root,encoding:'utf8'});assert.equal(validation.status,0,validation.stdout+validation.stderr);
 }finally{await fs.rm(temp,{recursive:true,force:true});}
});
