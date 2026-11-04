import {createClient} from '@sanity/client';
import fixture from '../../data/content.json';
import {readFile} from 'node:fs/promises';
export interface Media { _type?:string; localPath?:string; url?:string; alt?:string; caption?:string; image?:unknown }
export interface ContentDoc {
 _id:string; _type:string; title?:string; name?:string; slug?:{current:string}; summary?:string; body?:any[]; bio?:any[];
 section?:string; category?:string; publishedAt?:string; historical?:boolean; legacyPath?:string; sourceUrl?:string;
 cover?:Media; gallery?:Media[]; portrait?:Media; logo?:Media; homeImage?:Media;
 documents?:{_ref:string}[]; faqs?:{question:string;answer:string}[]; order?:number; role?:string;
 file?:{asset?:{_ref?:string}}; renderedFileRef?:string; pdfPath?:string; pdfUrl?:string; pages?:string[]; transcript?:string; description?:string; youtubeId?:string;
 seo?:{title?:string;description?:string;noindex?:boolean;imageUrl?:string};
 tagline?:string;homeTitle?:string;homeIntro?:string;contactEmail?:string;contactPhone?:string;
}
let loading:Promise<ContentDoc[]> | undefined;
const projectId=import.meta.env.SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID;
const dataset=import.meta.env.SANITY_DATASET || process.env.SANITY_DATASET || 'production';
export function getContent():Promise<ContentDoc[]> {
 if(!loading) loading=(async()=>{
  const mode=import.meta.env.CONTENT_SOURCE || process.env.CONTENT_SOURCE || 'local';
  if(!['local','sanity'].includes(mode))throw new Error('CONTENT_SOURCE must be local or sanity');
  let docs:ContentDoc[];
  if(mode==='local') docs=process.env.CONTENT_FIXTURE ? JSON.parse(await readFile(process.env.CONTENT_FIXTURE,'utf8')) : fixture as ContentDoc[];
  else {
   if(!projectId)throw new Error('CONTENT_SOURCE=sanity requires SANITY_PROJECT_ID');
   const client=createClient({projectId,dataset,apiVersion:'2026-11-01',useCdn:false,perspective:'published',token:import.meta.env.SANITY_READ_TOKEN || process.env.SANITY_READ_TOKEN});
   docs=await client.fetch(`*[_type in ["page","post","person","publication","video","siteSettings"] && !(_id in path("drafts.**"))]{...,
    cover{...,"url":image.asset->url}, portrait{...,"url":image.asset->url},logo{...,"url":image.asset->url},homeImage{...,"url":image.asset->url},
    gallery[]{...,"url":image.asset->url},"pdfUrl":file.asset->url,seo{...,"imageUrl":image.asset->url}
   }`);
  }
  docs=docs.filter(doc=>!doc._id.startsWith('drafts.'));
  // A replaced PDF must never display the old rendered pages or extracted text.
  docs=docs.map(doc=>doc._type==='publication' && doc.renderedFileRef && doc.file?.asset?._ref!==doc.renderedFileRef ? {...doc,pages:[],transcript:''} : doc);
  const settings=docs.find(d=>d._type==='siteSettings');
  if(!settings?.title)throw new Error('Missing site settings. Import the migrated content before enabling Sanity.');
  const paths=new Set<string>();
  for(const doc of docs.filter(d=>['page','post','publication'].includes(d._type))){
   if(!doc.title || !doc.slug?.current || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(doc.slug.current))throw new Error(`Invalid title or slug: ${doc._id}`);
   const route=routeFor(doc);if(paths.has(route))throw new Error(`Duplicate route: ${route}`);paths.add(route);
   if(doc._type==='page' && ['index','arxiu','admin'].includes(doc.slug.current))throw new Error(`Reserved route: ${route}`);
  }
  return docs;
 })();
 return loading;
}
export const routeFor=(doc:ContentDoc)=>doc._type==='post'?`/articles/${doc.slug?.current}/`:doc._type==='publication'?`/documents/${doc.slug?.current}/`:`/${doc.slug?.current}/`;
export const posts=(docs:ContentDoc[])=>docs.filter(d=>d._type==='post').sort((a,b)=>(b.publishedAt||'').localeCompare(a.publishedAt||''));
export const pageBy=(docs:ContentDoc[],slug:string)=>docs.find(d=>d._type==='page'&&d.slug?.current===slug);
export const settingsOf=(docs:ContentDoc[])=>docs.find(d=>d._type==='siteSettings')!;
export const mediaUrl=(media?:Media)=>media?.url || media?.localPath || '';
export const isIndexable=()=> (import.meta.env.PUBLIC_INDEXABLE || process.env.PUBLIC_INDEXABLE)==='true';
