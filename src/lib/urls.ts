import type {ContentDoc} from './content';
import {routeFor} from './content';
export function withBase(url:string):string {
 if(!url || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(url))return url;
 const base=import.meta.env.BASE_URL.replace(/\/$/,'');
 const normalized='/'+url.replace(/^\/+/, '');
 if(base && (normalized===base || normalized.startsWith(base+'/')))return normalized;
 return base+normalized;
}
export function legacyMap(docs:ContentDoc[]):Map<string,string>{
 return new Map([['index.html','/'],['arxiu.html','/arxiu/'],...docs.filter(d=>d.legacyPath).map(d=>[d.legacyPath!,routeFor(d)] as [string,string])]);
}
export function resolveLink(url:string,docs:ContentDoc[]):string {
 if(!url || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(url))return url;
 const [path,...suffix]=url.split(/(?=[?#])/);
 const target=legacyMap(docs).get(path.replace(/^\//,''))||path;
 return withBase(target+suffix.join(''));
}
