import type {APIRoute} from 'astro';
import {getContent} from '../lib/content';
import {legacyMap,withBase} from '../lib/urls';
import {escapeHtml} from '../lib/render';
export async function getStaticPaths(){
 const docs=await getContent();
 return [...legacyMap(docs)].filter(([from])=>from!=='index.html').map(([from,to])=>({params:{legacy:from.replace(/\.html$/,'')},props:{to}}));
}
export const GET:APIRoute=async ({props,site,params})=>{
 const to=props.to ?? legacyMap(await getContent()).get(params.legacy + ".html");
 if(!to) return new Response(null,{status:404});
 const target=withBase(to);const canonical=new URL(target,site).href;
 return new Response(`<!doctype html><html lang="ca"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${escapeHtml(target)}"><meta name="robots" content="noindex,follow"><link rel="canonical" href="${escapeHtml(canonical)}"><title>Pàgina traslladada · SOM CANET</title></head><body><p>Aquesta pàgina s’ha traslladat. <a href="${escapeHtml(target)}">Continua a la pàgina nova</a>.</p></body></html>`,{headers:{'Content-Type':'text/html; charset=utf-8'}});
};
