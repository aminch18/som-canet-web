import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';import ts from 'typescript';import {Schema} from '@sanity/schema';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('all migrated document types and root fields are supported by the real Studio schema',async()=>{
 const generated=path.join(root,`.tmp-studio-schema-${process.pid}.mjs`);
 try{
  const code=await fs.readFile(path.join(root,'studio/schemaTypes/index.ts'),'utf8');
  const output=ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
  await fs.writeFile(generated,output);
  const {schemaTypes}=await import(pathToFileURL(generated).href);
  const schema=Schema.compile({name:'verify',types:schemaTypes});
  const docs=JSON.parse(await fs.readFile(path.join(root,'data/content.json'),'utf8'));
  for(const doc of docs){
   const type=schema.get(doc._type);assert(type,doc._type);
   const fields=new Set(type.fields.map(field=>field.name));
   for(const key of Object.keys(doc))if(!key.startsWith('_'))assert(fields.has(key),`${doc._id}: unsupported field ${key}`);
  }
 }finally{await fs.unlink(generated).catch(()=>{});}
});
