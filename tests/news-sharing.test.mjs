import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createNewsPage,storyPage} from '../site/netlify/functions/news-page.mjs';
const template=readFileSync(new URL('../site/news.html',import.meta.url),'utf8');
const id='90000000-0000-4000-a000-000000000010',story={id,title:'Community gardens & shared spaces',summary:'A useful, complete source-backed explanation.',body_text:'A complete public article.\n\nRead https://official.example.org/apply',source_url:'https://official.example.org/apply'};
const event={httpMethod:'GET',queryStringParameters:{story:id},headers:{host:'kamunity-org-mpa.netlify.app'}};
test('the shared reader has no hard-coded Org Health shortcut',()=>{
  assert.doesNotMatch(template,/id="sm-tool-link"/);
  assert.doesNotMatch(template,/Open Org Health Check/);
});
test('initial HTML contains unique canonical metadata, a PNG preview and an escaped initial story',()=>{
  const html=storyPage(template,story);assert.match(html,/<title>Community gardens &amp; shared spaces — Kamunity News<\/title>/);assert.match(html,/property="og:image" content="https:\/\/phoenix-node.netlify.app\/\.netlify\/functions\/public-story-image\?story_id=/);assert.match(html,/name="twitter:card" content="summary_large_image"/);assert.equal((html.match(/property="og:title"/g)||[]).length,1);assert.match(html,/rel="canonical"[^>]*news\?story=/);assert.match(html,/id="kamunity-initial-story"/);assert.match(html,/<noscript><article/);
  const hostile=storyPage(template,{...story,title:'</title><script>alert(1)</script>',body_text:'</script><script>alert(2)</script>'});assert.ok(!hostile.includes('<script>alert'));assert.match(hostile,/\\u003c\/script>/);
});
test('public story boundary and failure states apply before any metadata is returned',async()=>{
  let calls=0;const page=createNewsPage({load:async()=>template,fetchImpl:async()=>{calls++;return {ok:true,json:async()=>({schema_version:'phoenix-mpa-news/v1',items:[]})};}});
  assert.equal((await page({...event,queryStringParameters:{story:'private-invalid'}})).statusCode,404);assert.equal(calls,0);
  const held=await page(event);assert.equal(held.statusCode,404);assert.equal(held.headers['X-Robots-Tag'],'noindex, nofollow');assert.ok(!held.body.includes('og:image'));
  const failed=createNewsPage({load:async()=>template,fetchImpl:async()=>{throw new Error('offline');}});assert.equal((await failed(event)).statusCode,503);
});
test('ordinary news browsing stays available and a valid story is embedded on the first response',async()=>{
  const page=createNewsPage({load:async()=>template,fetchImpl:async()=>({ok:true,json:async()=>({schema_version:'phoenix-mpa-news/v1',items:[story]})})});
  assert.equal((await page({...event,queryStringParameters:{}})).body,template);const result=await page(event);assert.equal(result.statusCode,200);assert.match(result.body,/Community gardens &amp; shared spaces/);assert.equal(result.headers['Cache-Control'],'no-store');
});
