import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const source=readFileSync(new URL('../site/js/weekly-summaries.js',import.meta.url),'utf8');
const context=vm.createContext({URL,Number,Date,origin:'https://phoenix-node.netlify.app'});
vm.runInContext(source.slice(source.indexOf('  function valid('),source.indexOf('  async function read(')),context);
const valid=item=>context.valid(item);
const item=()=>({id:'2026-11-29',title:'The weekly community-sector briefing',description:'A synthetic example.',script:'Organisations can review this published planning example with their teams.',duration:720,period:{start:'2026-11-21T16:00:00Z',end:'2026-11-28T16:00:00Z'},audioUrl:'https://phoenix-node.netlify.app/.netlify/functions/weekly-summary-audio?id=2026-11-29',sources:[{id:'publication',title:'Published example',url:'https://example.org'}],briefing:{publicationsConsidered:1,publicationsCovered:1,publicationsExcluded:0,actions:[{text:'Organisations can review this published planning example with their teams.',sourceIds:['publication']}]}});
test('accepts twelve-minute briefings and existing editions without briefing metadata',()=>{
 assert.equal(valid(item()),true);const old=item();delete old.briefing;old.duration=284.9;assert.equal(valid(old),true);
});
test('rejects audio and scripts above their delivery bounds',()=>{
 const longAudio=item();longAudio.duration=720.001;assert.equal(valid(longAudio),false);
 const longScript=item();delete longScript.briefing;longScript.script='x'.repeat(14000);assert.equal(valid(longScript),true);longScript.script+='x';assert.equal(valid(longScript),false);
});
test('rejects inconsistent coverage counts and actions absent from narration or sources',()=>{
 for(const mutate of [i=>i.briefing.publicationsConsidered=2,i=>i.briefing.publicationsCovered=0,i=>i.briefing.actions[0].text='Advice that is not present in the spoken recording.',i=>i.briefing.actions[0].sourceIds=['private-draft']]){const value=item();mutate(value);assert.equal(valid(value),false);}
});
