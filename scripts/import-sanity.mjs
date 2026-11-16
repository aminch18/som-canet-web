import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createClient} from '@sanity/client';

const publicRoot = fileURLToPath(new URL('../public/', import.meta.url)).replace(/\/$/, '');

function uploadSpec(value) {
 if (value._type === 'media' && value.localPath && !value.image) return ['image', value.localPath];
 if (value._type === 'publication' && value.pdfPath && !value.file) return ['file', value.pdfPath];
}

function assetPath(localPath) {
 const filename = path.resolve(publicRoot, localPath);
 if (!filename.startsWith(publicRoot + path.sep)) throw new Error('Asset must be inside public/');
 return filename;
}

async function checkLocalAssets(docs) {
 const files = new Set();
 function visit(value) {
  if (!value || typeof value !== 'object') return;
  const spec = uploadSpec(value);
  if (spec) files.add(assetPath(spec[1]));
  Object.values(value).forEach(visit);
 }
 visit(docs);
 await Promise.all([...files].map(async filename => {
  if (!(await fs.stat(filename)).isFile()) throw new Error('Expected a file: ' + filename);
 }));
 return files.size;
}

export async function planImport(client, docs) {
 const ids = docs.map(doc => doc._id);
 const drafts = ids.map(id => 'drafts.' + id);
 const remote = await client.fetch(
  '*[_id in $ids || _id in $drafts || _id in path("versions.**")]{_id,_type}',
  {ids, drafts}, {perspective: 'raw'},
 );
 const byId = new Map(remote.map(doc => [doc._id, doc]));
 const variants = new Set(remote.map(doc => doc._id.replace(/^(drafts\.|versions\.[^.]+\.)/, '')));
 const pending = [];
 const conflicts = [];
 let existing = 0;
 for (const doc of docs) {
  const published = byId.get(doc._id);
  if (published && published._type !== doc._type) {
   conflicts.push(doc._id + ': existing document has type ' + published._type + ', expected ' + doc._type);
  } else if (published) {
   existing++;
  } else if (variants.has(doc._id)) {
   conflicts.push(doc._id + ': only an unpublished draft or release version exists');
  } else {
   pending.push(doc);
  }
 }
 if (conflicts.length) throw new Error('Resolve destination conflicts before importing:\n' + conflicts.join('\n'));
 // Publications must exist before creating pages or posts that reference them.
 pending.sort((a, b) => Number(b._type === 'publication') - Number(a._type === 'publication'));
 return {pending, existing};
}

export async function importPending(client, pending, onProcessed = () => {}) {
 const uploaded = new Map();
 async function asset(localPath, type) {
  const cacheKey = type + ':' + localPath;
  if (!uploaded.has(cacheKey)) {
   const filename = assetPath(localPath);
   const data = await fs.readFile(filename);
   const result = await client.assets.upload(type, data, {filename: path.basename(filename)});
   uploaded.set(cacheKey, {_type: 'reference', _ref: result._id});
  }
  return uploaded.get(cacheKey);
 }

 async function transform(value) {
  if (Array.isArray(value)) {
   const result = [];
   for (const item of value) result.push(await transform(item));
   return result;
  }
  if (!value || typeof value !== 'object') return value;
  const result = {};
  for (const [key, item] of Object.entries(value)) result[key] = await transform(item);
  const spec = uploadSpec(value);
  if (spec?.[0] === 'image') result.image = {_type: 'image', asset: await asset(spec[1], 'image')};
  if (spec?.[0] === 'file') {
   const ref = await asset(spec[1], 'file');
   result.file = {_type: 'file', asset: ref};
   result.renderedFileRef = ref._ref;
  }
  return result;
 }

 for (const doc of pending) {
  await client.createIfNotExists(await transform(doc));
  onProcessed(doc._id);
 }
}

async function main(args) {
 const [flag] = args;
 if (args.length > 1 || (flag && !['--check-target', '--apply'].includes(flag))) {
  throw new Error('Usage: npm run content:import [-- --check-target | --apply]');
 }
 const docs = JSON.parse(await fs.readFile(new URL('../data/content.json', import.meta.url), 'utf8'));
 const assets = await checkLocalAssets(docs);
 if (!flag) {
  const types = docs.reduce((counts, doc) => {
   counts[doc._type] = (counts[doc._type] || 0) + 1;
   return counts;
  }, {});
  console.log(JSON.stringify({mode: 'dry-run', documents: docs.length, assets, types}, null, 2));
  return;
 }

 const {SANITY_PROJECT_ID: projectId, SANITY_WRITE_TOKEN: token} = process.env;
 const dataset = process.env.SANITY_DATASET;
 if (!projectId || !dataset || !token) {
  throw new Error('Set SANITY_PROJECT_ID, SANITY_DATASET and SANITY_WRITE_TOKEN in your local environment.');
 }
 console.log('Sanity destination: ' + projectId + '/' + dataset);
 const client = createClient({projectId, dataset, token, apiVersion: '2026-11-01', useCdn: false});
 const {pending, existing} = await planImport(client, docs);
 console.log(`Plan: ${pending.length} pending, ${existing} existing published documents preserved.`);
 if (flag === '--check-target') return;
 await importPending(client, pending, id => console.log('Processed', id));
 const verified = await planImport(client, docs);
 if (verified.pending.length) throw new Error('Import verification found missing documents. Recheck the destination and retry.');
 console.log(`Verified ${verified.existing} published documents by ID and type.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
 try {
  await main(process.argv.slice(2));
 } catch (error) {
  console.error(error.message);
  process.exitCode = 1;
 }
}
