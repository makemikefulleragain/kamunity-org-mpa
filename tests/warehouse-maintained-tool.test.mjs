import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const source=readFileSync(new URL('../site/warehouse.html',import.meta.url),'utf8');
test('a maintained Phoenix release enriches the existing card once, retaining the newest version',async()=>{
 const card={dataset:{},notes:[],querySelector(){return this.notes[0]||null;},appendChild(note){this.notes.push(note);}},row={},wrap={style:{}},link={href:'https://kamunity-org-health.netlify.app/',closest:()=>card};
 const items=[{id:'old',published_at:'2026-10-01',artifact:{url:link.href},maintenance:{version:'1.0.0'}},{id:'new',published_at:'2026-11-07',title:'Org Health Check',artifact:{url:link.href},maintenance:{version:'1.1.0',next_review_due:'2027-02-07'}}];
 const context=vm.createContext({URL,Map,Set,location:{hash:''},PHOENIX_TOOLS_ENDPOINT:'https://example.org/tools',PHOENIX_TOOLS_SCHEMA:'phoenix-mpa-tools/v1',buildFeedUrl:()=>'',fetch:async()=>({ok:true,json:async()=>({schema_version:'phoenix-mpa-tools/v1',items})}),document:{getElementById:id=>id==='field-tools-row'?row:wrap,querySelectorAll:()=>[link],createElement:()=>({})}});
 vm.runInContext(source.slice(source.indexOf('async function loadFieldTools()'),source.indexOf('\nfunction openFieldTool')),context);
 await vm.runInContext('loadFieldTools()',context);
 assert.equal(card.id,'phoenix-new');assert.equal(card.dataset.toolId,'new');assert.equal(card.notes.length,1);assert.match(card.notes[0].textContent,/1.1.0.*2027-02-07/);assert.equal(row.innerHTML,'');assert.equal(wrap.style.display,'none');
});
test('word-boundary snippets retain a complete last word',()=>{
 const fn=source.slice(source.indexOf('function stripMarkdownForSnippet('),source.indexOf('\n}',source.indexOf('function briefSnippet('))+2);
 const context=vm.createContext({});vm.runInContext(fn,context);assert.equal(vm.runInContext("briefSnippet('One completed word and unfinished',20)",context),'One completed word…');
});
