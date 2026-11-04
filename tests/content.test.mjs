import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
const docs=JSON.parse(fs.readFileSync(new URL('../data/content.json',import.meta.url),'utf8'));
test('migration preserves all posts, team members, publications and rendered document pages',()=>{
 assert.equal(docs.filter(d=>d._type==='post').length,37);assert.equal(docs.filter(d=>d._type==='person').length,10);assert.equal(docs.filter(d=>d._type==='publication').length,6);
 assert.equal(docs.filter(d=>d._type==='publication').reduce((n,d)=>n+d.pages.length,0),57);
});
test('content references resolve and every slug is unique within its route',()=>{
 const ids=new Set();const routes=new Set();for(const doc of docs){assert(!ids.has(doc._id));ids.add(doc._id);if(doc.slug){const route=doc._type+':'+doc.slug.current;assert(!routes.has(route),route);routes.add(route);assert.match(doc.slug.current,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);}}
 for(const doc of docs)for(const ref of doc.documents||[])assert(ids.has(ref._ref),ref._ref);
});
test('all local media and PDFs exist inside public/',()=>{
 function visit(value){if(Array.isArray(value)){value.forEach(visit);return;}if(!value||typeof value!=='object')return;
 for(const [key,item] of Object.entries(value)){if(['localPath','pdfPath'].includes(key)&&typeof item==='string')assert(fs.existsSync(new URL('../public/'+item,import.meta.url)),item);else visit(item);}}
 docs.forEach(visit);
});
