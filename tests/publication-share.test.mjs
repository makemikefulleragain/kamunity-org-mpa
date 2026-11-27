import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {storyPage} from '../site/netlify/functions/news-page.mjs';

const source=readFileSync(new URL('../site/js/publication-share.js',import.meta.url),'utf8');
const story={id:'90000000-0000-4000-a000-000000000010',title:"A community's plans & shared spaces"};
const address='https://kamunity-org-mpa.netlify.app/news?story='+story.id;

function sharing(navigator={}) {
  const document={activeElement:null};
  function element(tag) {
    return {tag,children:[],attributes:{},events:{},isConnected:true,textContent:'',
      appendChild(child){child.parentElement=this;this.children.push(child);return child;},
      remove(){const list=this.parentElement.children;list.splice(list.indexOf(this),1);this.parentElement=null;this.isConnected=false;},
      setAttribute(name,value){this.attributes[name]=value;},
      removeAttribute(name){delete this.attributes[name];},
      addEventListener(name,callback){this.events[name]=callback;},
      focus(){document.activeElement=this;},
      select(){this.selected=true;},
    };
  }
  document.createElement=element;
  const window={location:{href:'https://deploy-preview-99--kamunity-org-mpa.netlify.app/news?story=another&utm_source=campaign#section'}};
  runInNewContext(source,{window,document,navigator});
  const root=element('div'),button=window.KamunityShare.createButton(story);
  root.appendChild(button);
  const nodes=()=>{const walk=n=>[n,...n.children.flatMap(walk)];return walk(root);};
  return {...window.KamunityShare,document,root,button,nodes};
}

test('the shared address matches server canonical metadata and excludes the current page and campaign',()=>{
  const api=sharing();
  const template=readFileSync(new URL('../site/news.html',import.meta.url),'utf8');
  assert.ok(storyPage(template,{...story,summary:'Complete summary.',body_text:'Public body.'}).includes('<link rel="canonical" href="'+address+'">'));
  assert.equal(api.articleUrl(story),address);
  assert.equal(api.articleUrl({_story_id:story.id.toUpperCase()}),address);
  for(const id of ['',undefined,'phoenix-'+story.id,'../private','https://example.org'])assert.equal(api.createButton({id}),null);
});

test('a click immediately invokes native sharing with the selected headline and URL',async()=>{
  const calls=[],api=sharing({share:async data=>calls.push(data)});
  const click=api.button.events.click();
  assert.equal(calls.length,1,'native sharing stays in the original user gesture');
  assert.equal(calls[0].title,story.title);assert.equal(calls[0].text,story.title);assert.equal(calls[0].url,address);
  await click;
  assert.equal(api.button.disabled,false);
  assert.equal(api.nodes().some(n=>n.attributes.role==='status'),false,'a native handoff does not claim delivery');
});

test('unsupported native sharing copies the link and announces only a completed copy',async()=>{
  const copied=[],api=sharing({clipboard:{writeText:async text=>copied.push(text)}});
  assert.equal(copied.length,0);
  await api.button.events.click();
  assert.deepEqual(copied,[address]);
  assert.equal(api.nodes().find(n=>n.attributes.role==='status').textContent,'Link copied');
});

test('a browser unable to share this payload uses the clipboard fallback',async()=>{
  let shared=false,copied='';
  const api=sharing({canShare:()=>false,share:async()=>{shared=true;},clipboard:{writeText:async value=>{copied=value;}}});
  await api.button.events.click();
  assert.equal(shared,false);assert.equal(copied,address);
});

test('cancelling native sharing is quiet and does not copy anything',async()=>{
  let copied=false;
  const api=sharing({share:async()=>{throw Object.assign(new Error('cancelled'),{name:'AbortError'});},clipboard:{writeText:async()=>{copied=true;}}});
  await api.button.events.click();
  assert.equal(copied,false);assert.equal(api.root.children.length,1);assert.equal(api.button.disabled,false);
});

test('a native error offers an explicit fresh copy gesture instead of changing the clipboard automatically',async()=>{
  let copied='';
  const api=sharing({share:async()=>{throw new Error('blocked');},clipboard:{writeText:async text=>{copied=text;}}});
  await api.button.events.click();
  assert.equal(copied,'');
  const copy=api.nodes().find(n=>n.tag==='button'&&n.textContent==='Copy link');
  assert.ok(copy);await copy.events.click();
  assert.equal(copied,address);assert.equal(api.nodes().some(n=>n.attributes.role==='group'),false);
  assert.equal(api.document.activeElement,api.button);
});

test('a blocked clipboard exposes a selected read-only link and Escape closes only its fallback',async()=>{
  const api=sharing({clipboard:{writeText:async()=>{throw new Error('denied');}}});
  await api.button.events.click();
  const input=api.nodes().find(n=>n.tag==='input'),group=api.nodes().find(n=>n.attributes.role==='group');
  assert.equal(input.value,address);assert.equal(input.readOnly,true);assert.equal(input.selected,true);assert.equal(api.document.activeElement,input);
  assert.equal(api.nodes().some(n=>n.textContent==='Link copied'),false);
  let prevented=false,stopped=false;
  group.events.keydown({key:'Escape',preventDefault(){prevented=true;},stopPropagation(){stopped=true;}});
  assert.equal(prevented,true);assert.equal(stopped,true);assert.equal(api.document.activeElement,api.button);
  assert.equal(api.nodes().some(n=>n.attributes.role==='group'),false);
});

test('repeated clicks cannot launch overlapping native share sheets',async()=>{
  let resolve,calls=0;
  const api=sharing({share:()=>{calls++;return new Promise(done=>{resolve=done;});}});
  const first=api.button.events.click();await api.button.events.click();assert.equal(calls,1);
  resolve();await first;assert.equal(api.button.disabled,false);
});

test('homepage and News load the sharing control before their renderers',()=>{
  for(const [page,renderer] of [['index.html','supabase-feed.js'],['news.html','news.js']]){
    const html=readFileSync(new URL('../site/'+page,import.meta.url),'utf8');
    const shared=html.lastIndexOf('publication-share.js');
    assert.ok(shared>=0&&shared<html.lastIndexOf(renderer));
  }
});
