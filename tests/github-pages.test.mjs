import test from 'node:test';import assert from 'node:assert/strict';
import {pagesEnvironment} from '../scripts/github-pages-env.mjs';
test('personal repository and account root site use the correct base paths',()=>{
 assert.deepEqual(pagesEnvironment({GITHUB_REPOSITORY:'aminch18/som-canet-web'}),{SITE_URL:'https://aminch18.github.io',BASE_PATH:'/som-canet-web/'});
 assert.equal(pagesEnvironment({GITHUB_REPOSITORY:'aminch18/aminch18.github.io'}).BASE_PATH,'/');
});
test('Pages metadata supports custom domains and normalizes repository paths',()=>{
 assert.deepEqual(pagesEnvironment({GITHUB_REPOSITORY:'aminch18/som-canet-web',PAGES_SITE_URL:'https://som.example.org',PAGES_BASE_PATH:''}),{SITE_URL:'https://som.example.org',BASE_PATH:'/'});
 assert.equal(pagesEnvironment({GITHUB_REPOSITORY:'aminch18/som-canet-web',PAGES_BASE_PATH:'/som-canet-web'}).BASE_PATH,'/som-canet-web/');
});
test('invalid build destinations cannot inject environment lines',()=>{
 assert.throws(()=>pagesEnvironment({GITHUB_REPOSITORY:'invalid'}));
 assert.throws(()=>pagesEnvironment({GITHUB_REPOSITORY:'owner/repo',PAGES_BASE_PATH:'/repo\nPUBLIC_INDEXABLE=true'}));
 assert.throws(()=>pagesEnvironment({GITHUB_REPOSITORY:'owner/repo',PAGES_SITE_URL:'http://example.org'}));
});
