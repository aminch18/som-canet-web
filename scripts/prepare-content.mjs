import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';
import {Schema} from '@sanity/schema';
import {htmlToBlocks} from '@portabletext/block-tools';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const schema=Schema.compile({name:'migration',types:[{name:'migration',type:'object',fields:[{name:'body',type:'array',of:[{type:'block'}]}]}]});
const blockType=schema.get('migration').fields.find(f=>f.name==='body').type;
const portable=html=>htmlToBlocks(html||'',blockType,{parseHtml:html=>new JSDOM(html).window.document});
const sourceDir=process.argv[2];
if(!sourceDir)throw new Error('Migration-only tool: provide the extracted static backup directory. The live content is data/content.json.');
const documents=[];const source=new Map();
for(const name of (await fs.readdir(sourceDir)).filter(n=>n.endsWith('.html')))source.set(name,new JSDOM(await fs.readFile(path.join(sourceDir,name),'utf8')).window.document);
const media=(img,alt='Imatge de SOM CANET')=>img?{_type:'media',localPath:img.getAttribute('src'),alt:img.getAttribute('alt')||alt}:undefined;
const pubTitles=['Revista SOM CANET · Document 1','Nota de premsa · Govern municipal','Programa electoral 2019–2023','Revista SOM CANET · Publicació 2017','Revista SOM CANET · Document 2','Revista del segon aniversari'];
const pubSlugs=['revista-document-1','nota-premsa-govern-municipal','programa-electoral-2019-2023','revista-publicacio-2017','revista-document-2','revista-segon-aniversari'];
const pdfDocs=new Map();
for(const [name,doc] of source){if(!name.startsWith('document-'))continue;
 const i=pdfDocs.size;const record={_id:`publication-${i+1}`,_type:'publication',title:pubTitles[i],slug:{_type:'slug',current:pubSlugs[i]},legacyPath:name,pdfPath:doc.querySelector('a[href$=".pdf"]')?.getAttribute('href'),pages:JSON.parse(doc.querySelector('.pdf-reader')?.getAttribute('data-pages')||'[]'),transcript:doc.querySelector('.document-transcript .prose')?.textContent||'',historical:true};
 if(record.pages.length)record.cover={_type:'media',localPath:record.pages[0],alt:'Portada: '+record.title};
 pdfDocs.set(name,record);documents.push(record);
}
const manifest=JSON.parse(await fs.readFile(path.join(root,'content/migration-manifest.json'),'utf8'));
for(const [url,pdf] of Object.entries(manifest.documents)){const doc=documents.find(d=>d.pdfPath===pdf);if(doc)doc.sourceUrl=url;}
const slugify=t=>t.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,100).replace(/-$/,'');
const sections={historia:'projecte',equip:'projecte','sant-jordi-2016':'projecte','grup-municipal':'grup-municipal',regidoria:'grup-municipal','valoracio-mandat':'grup-municipal','discurs-regidora':'grup-municipal','programa-2019':'grup-municipal','raquel-serra':'revista','jordi-planet':'revista','ramon-faucon':'revista','ricard-molins':'revista','jose-luis-cuba':'revista',malika:'revista',videos:'revista',revista:'revista'};
for(const [name,doc] of source){if(name.startsWith('document-')||['index.html','arxiu.html'].includes(name))continue;
 const key=name.replace('.html','');const isPost=key.startsWith('entrada-');const title=doc.querySelector('h1')?.textContent.trim()||key;
 const sourceUrl=doc.querySelector('.source-note a')?.getAttribute('href');const date=sourceUrl?.match(/single-post\/(\d{4})\/(\d{2})\/(\d{2})/);
 const gallery=[...doc.querySelectorAll('.content-gallery img')].map((img,i)=>({...media(img),_key:`image-${i}`}));
 const summary=doc.querySelector('.page-heading .lead')?.textContent.trim()||doc.querySelector('.prose p')?.textContent.trim().replace(/\s+/g,' ').slice(0,180)||'';
 const linked=[...new Set([...doc.querySelectorAll('main a[href]')].map(a=>a.getAttribute('href')).filter(h=>pdfDocs.has(h)))];
 const record={_id:key,_type:isPost?'post':'page',title,slug:{_type:'slug',current:isPost?slugify(title):key},summary,body:portable(doc.querySelector('.prose')?.innerHTML||''),historical:isPost||!!doc.querySelector('.historical-note'),section:sections[key]||key,legacyPath:name,sourceUrl,gallery,cover:gallery[0]||media(doc.querySelector('.team-photo')),documents:linked.map((name,i)=>({_type:'reference',_key:`doc-${i}`,_ref:pdfDocs.get(name)._id})),seo:{_type:'seo',description:summary.slice(0,170)}};
 if(isPost){record.publishedAt=date?`${date[1]}-${date[2]}-${date[3]}T12:00:00Z`:undefined;record.category='hemeroteca';}
 record.faqs=[...doc.querySelectorAll('.faq details')].map((node,i)=>({_type:'faq',_key:`faq-${i}`,question:node.querySelector('summary')?.textContent.replace('+','').trim(),answer:node.querySelector('p')?.textContent}));
 if(isPost){delete record.section;delete record.faqs;}
 documents.push(record);
}
[...source.get('equip.html').querySelectorAll('.person')].forEach((person,i)=>{
 const node=person.querySelector('div').cloneNode(true);const role=node.querySelector('.role')?.textContent;node.querySelector('.role')?.remove();const name=node.querySelector('h2,h3')?.textContent||`Persona ${i+1}`;node.querySelector('h2,h3')?.remove();
 documents.push({_id:`person-${i+1}`,_type:'person',name,role,bio:portable(node.innerHTML),portrait:media(person.querySelector('img'),name),historical:true,order:i});
});
[...source.get('videos.html').querySelectorAll('.video-item')].forEach((node,i)=>documents.push({_id:`video-${i+1}`,_type:'video',title:node.querySelector('h2')?.textContent,youtubeId:node.querySelector('iframe')?.src.match(/embed\/([\w-]+)/)?.[1],order:i}));
const home=source.get('index.html');
documents.push({_id:'site-settings',_type:'siteSettings',title:'SOM CANET',tagline:'Canet i la seva gent, al centre.',homeTitle:home.querySelector('h1')?.textContent.replace(',al',', al'),homeIntro:home.querySelector('.hero-panel p:not(.eyebrow)')?.textContent,homeImage:media(home.querySelector('.home-hero>img')),logo:media(home.querySelector('.brand img')),contactEmail:'somcanet2019@gmail.com',contactPhone:'658 313 234',seo:{_type:'seo',description:'Coneix SOM CANET: projecte municipal, història, revista, articles i participació a Canet de Mar.'}});
await fs.writeFile(path.join(root,'data/content.json'),JSON.stringify(documents,null,2)+'\n');
console.log('Content prepared:',documents.length,'documents; posts:',documents.filter(d=>d._type==='post').length);
