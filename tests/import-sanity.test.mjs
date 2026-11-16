import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {importPending, planImport} from '../scripts/import-sanity.mjs';

const docs = JSON.parse(await readFile(new URL('../data/content.json', import.meta.url), 'utf8'));

test('the import preserves existing documents, creates references in order and can be retried', async () => {
 const settings = docs.find(doc => doc._id === 'site-settings');
 const existing = {...settings, title: 'Títol editat al Studio'};
 const remote = new Map([[existing._id, existing], ['drafts.site-settings', {...existing, _id: 'drafts.site-settings'}]]);
 const uploaded = new Map();
 const client = {
  fetch: async (_query, {ids, drafts}, {perspective}) => {
   assert.equal(perspective, 'raw');
   return [...remote.values()].filter(doc => ids.includes(doc._id) || drafts.includes(doc._id));
  },
  assets: {
   upload: async (type, bytes, {filename}) => {
    assert(bytes.length > 0);
    const key = type + ':' + filename;
    assert(!uploaded.has(key), 'shared assets should only upload once per run');
    const id = key + '-asset';
    uploaded.set(key, id);
    return {_id: id};
   },
  },
  createIfNotExists: async doc => {
   for (const reference of doc.documents || []) assert(remote.has(reference._ref));
   if (doc._type === 'publication') assert.equal(doc.file.asset._ref, doc.renderedFileRef);
   assert(!remote.has(doc._id), 'existing IDs should be skipped');
   remote.set(doc._id, doc);
  },
 };
 const initial = await planImport(client, docs);
 assert.equal(initial.existing, 1);
 assert.equal(initial.pending.length, 77);
 // Simulate an interruption after writing one publication, then resume from a new plan.
 await importPending(client, initial.pending.slice(0, 1));
 const retry = await planImport(client, docs);
 assert.equal(retry.existing, 2);
 await importPending(client, retry.pending);
 assert.equal(remote.get(existing._id).title, 'Títol editat al Studio');
 assert.equal(remote.get('drafts.site-settings').title, 'Títol editat al Studio');
 const completed = await planImport(client, docs);
 assert.equal(completed.existing, 78);
 assert.deepEqual(completed.pending, []);
});

test('the import stops on unpublished variants or a conflicting published type', async () => {
 const publication = docs.find(doc => doc._type === 'publication');
 for (const [id, type, expected] of [
  ['drafts.' + publication._id, publication._type, /unpublished/],
  ['versions.release1.' + publication._id, publication._type, /unpublished/],
  [publication._id, 'post', /has type post/],
 ]) {
  const client = {fetch: async () => [{_id: id, _type: type}]};
  await assert.rejects(planImport(client, docs), expected);
 }
});
