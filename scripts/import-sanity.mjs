import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createClient} from '@sanity/client';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const docs=JSON.parse(await fs.readFile(path.join(root,'data/content.json'),'utf8'));
if(!process.argv.includes('--apply')){
 console.log(JSON.stringify({mode:'dry-run',documents:docs.length,types:docs.reduce((a,d)=>(a[d._type]=(a[d._type]||0)+1,a),{}),message:'No remote writes. Configure SANITY_PROJECT_ID, SANITY_DATASET and SANITY_WRITE_TOKEN; then run npm run content:import -- --apply.'},null,2));
 process.exit(0);
}
const {SANITY_PROJECT_ID:projectId,SANITY_WRITE_TOKEN:token}=process.env;
const dataset=process.env.SANITY_DATASET||'production';
if(!projectId||!token)throw new Error('SANITY_PROJECT_ID and SANITY_WRITE_TOKEN are required. Keep credentials in .env, never in source or PUBLIC_ variables.');
const client=createClient({projectId,dataset,token,apiVersion:'2026-11-01',useCdn:false});
const existing=new Set(await client.fetch('*[_id in $ids]._id',{ids:docs.map(d=>d._id)}));
const pending=docs.filter(d=>!existing.has(d._id));
const uploaded=new Map();
async function asset(localPath,type){
 const cacheKey=type+':'+localPath;
 if(uploaded.has(cacheKey))return uploaded.get(cacheKey);
 const publicRoot=path.resolve(root,'public');const filename=path.resolve(publicRoot,localPath);
 if(!filename.startsWith(publicRoot+path.sep))throw new Error('Asset must be inside public/');
 const data=await fs.readFile(filename);
 const result=await client.assets.upload(type,data,{filename:path.basename(filename)});
 const reference={_type:'reference',_ref:result._id};uploaded.set(cacheKey,reference);return reference;
}
async function transform(value){
 if(Array.isArray(value)) {const result=[];for(const item of value)result.push(await transform(item));return result;}
 if(!value||typeof value!=='object')return value;
 const result={};for(const [key,item] of Object.entries(value))result[key]=await transform(item);
 if(value._type==='media'&&value.localPath&&!value.image) result.image={_type:'image',asset:await asset(value.localPath,'image')};
 if(value._type==='publication'&&value.pdfPath&&!value.file){const ref=await asset(value.pdfPath,'file');result.file={_type:'file',asset:ref};result.renderedFileRef=ref._ref;}
 return result;
}
// Publications first: page/post references resolve without weak references.
pending.sort((a,b)=>Number(b._type==='publication')-Number(a._type==='publication'));
for(const doc of pending){
 await client.createIfNotExists(await transform(doc));
 console.log('Created',doc._id);
}
console.log(`Import complete: ${pending.length} created, ${existing.size} existing documents left unchanged.`);
