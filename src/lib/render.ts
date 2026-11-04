import {toHTML} from '@portabletext/to-html';
import sanitizeHtml from 'sanitize-html';
import type {ContentDoc} from './content';
import {resolveLink,withBase} from './urls';
export function renderBody(body:any[]|undefined,docs:ContentDoc[]):string {
 if(!body?.length)return '';
 const html=toHTML(body,{components:{types:{media:({value}:any)=>{
  const src=value.url||value.localPath||assetUrl(value.image?.asset?._ref);
  if(!src)return '';
  return `<figure><img src="${escapeHtml(withBase(src))}" alt="${escapeHtml(value.alt||'Imatge de SOM CANET')}" loading="lazy">${value.caption?`<figcaption>${escapeHtml(value.caption)}</figcaption>`:''}</figure>`;
 }}}});
 return sanitizeHtml(html,{allowedTags:sanitizeHtml.defaults.allowedTags.concat(['img','figure','figcaption']),allowedAttributes:{a:['href','target','rel'],img:['src','alt','loading']},allowedSchemes:['http','https','mailto','tel'],transformTags:{a:(tag,attrs)=>({tagName:tag,attribs:{...attrs,href:resolveLink(attrs.href||'',docs),...(attrs.target==='_blank'?{rel:'noopener noreferrer'}:{})}})}});
}
export function escapeHtml(value:string):string{return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));}
function assetUrl(ref?:string):string {
 const projectId=import.meta.env.SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID;
 const dataset=import.meta.env.SANITY_DATASET || process.env.SANITY_DATASET || 'production';
 const match=ref?.match(/^image-(.+)-(\d+x\d+)-(\w+)$/);
 return match&&projectId?`https://cdn.sanity.io/images/${projectId}/${dataset}/${match[1]}-${match[2]}.${match[3]}`:'';
}
export const jsonLd=(object:unknown)=>JSON.stringify(object).replace(/</g,'\\u003c');
