/* One inventory, presented with MPA's Shop cards and Warehouse aisles. */
(function(){
 'use strict';
 var host=document.querySelector('[data-tool-catalogue]');if(!host)return;
 var mode=host.dataset.toolCatalogue,rowsMode=mode!=='full',query=new URLSearchParams(location.search);
 var theme=['quick','dig'].includes(query.get('theme'))?query.get('theme'):'all';
 var items=[],connection='loading',search=document.getElementById('wh-search'),shelves=[];
 function el(tag,text,attrs){var node=document.createElement(tag);if(text!==undefined)node.textContent=text;Object.entries(attrs||{}).forEach(function(pair){node.setAttribute(pair[0],pair[1]);});return node;}
 function normal(value){try{var u=new URL(value,location.origin);return u.origin+u.pathname.replace(/\/index\.html$/,'').replace(/\/$/,'')+u.search;}catch(e){return '';}}
 function safe(value){try{var u=new URL(value,location.origin);return u.protocol==='https:'||u.origin===location.origin?u.href:'';}catch(e){return '';}}
 function publishedTime(item){return Date.parse(item.createdAt||item.created_at||item.publishedAt||item.published_at||'');}
 function isNew(item){var time=publishedTime(item),now=Date.now();return Number.isFinite(time)&&time<=now&&time>=now-30*86400000;}
 function iconFor(item){
  var icons={'ai-safety-checklist':'🛡️','board-paper-pack':'📋','grant-acquittal-helper':'📊','sovereignty-check':'🔍','ai-readiness':'🤖'};
  if(icons[item.id])return icons[item.id];
  if(/health/i.test(item.title))return '🌱';if(/volunteer/i.test(item.title))return '🤝';
  if(/checklist/i.test(item.kind))return '📋';if(item.kind==='handout')return '📄';return '⚒';
 }
 var controls=el('div',undefined,{class:'catalogue-controls'}),filters=el('nav',undefined,{'aria-label':'Tool themes',class:'catalogue-filters'});
 var status=el('p','Loading tools…',{role:'status',class:'shop-dynamic-status catalogue-status'});
 var content=el('div',undefined,{class:rowsMode?'catalogue-rows':'catalogue-grid'});
 if(!rowsMode)content.setAttribute('role','list');
 if(!search){var label=el('label','Find a tool or download');search=el('input',undefined,{type:'search','aria-label':'Find a tool or download',placeholder:'Search tasks, titles or tool types',class:'wh-search-input'});label.append(search);controls.append(label);}
 if(!rowsMode)controls.append(filters);if(controls.childElementCount)host.append(controls);host.append(status,content);

 function cardFor(item,row){
  var card=el('article',undefined,{class:'catalogue-card '+(mode==='warehouse'?'wh-tool-card':'shop-card'),'data-search':[item.title,item.summary,item.kind].join(' '),role:'listitem','data-tool-id':item.id});
  // The New shelf is another view of the same tool, not another tool or DOM ID.
  if(item.outputId)card.id='phoenix-'+(row==='new'?'new-':'')+item.outputId;
  if(mode!=='warehouse')card.append(el('span',iconFor(item),{class:'shop-card-icon','aria-hidden':'true'}));
  card.append(el('span',(item.theme==='quick'?'Quick tools':'Dig in')+' · '+item.kind,{class:'wh-tool-badge catalogue-kind'}));
  card.append(el(mode==='shop'?'h4':'h3',item.title),el('p',item.summary));
  if(item.maintenance)card.append(el('div','Maintainer: '+item.maintenance.maintainer+' · '+item.maintenance.version+' · Review due '+item.maintenance.next_review_due,{class:'shop-card-meta wh-phoenix-maintenance'}));
  else card.append(el('div',item.reviewStatus||'Review date not recorded',{class:'shop-card-meta'}));
  var href=safe(item.publicUrl||item.url);
  if(href){var actions=el('div',undefined,{class:'shop-card-actions'}),link=el('a',item.kind==='handout'||item.kind==='template'?'Open or download':'Open tool',{href:href,class:mode==='warehouse'?'ask-kai-btn':'shop-btn'});link.append(el('span',' →',{'aria-hidden':'true'}));actions.append(link);card.append(actions);}
  return card;
 }
 function scrollShelf(shelf,direction){
  var first=shelf.querySelector('.catalogue-card'),step=first?first.getBoundingClientRect().width+16:shelf.clientWidth;
  shelf.scrollBy({left:direction*step,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
 }
 function shelfFor(key,title,description,entries,index){
  var warehouse=mode==='warehouse',id=warehouse?'aisle-'+({new:'new',quick:'tools',dig:'assessments'}[key]):'shop-'+key;
  var wrap=warehouse?el('div',undefined,{class:'hp-section-wrap wh-aisle-wrap wh-aisle-wrap--'+({new:'new',quick:'tools',dig:'assessments'}[key])}):null;
  var section=el('section',undefined,{class:(warehouse?'wh-aisle ':'')+'catalogue-section','data-catalogue-row':key,id:id,'aria-labelledby':id+'-heading'});
  if(warehouse)section.append(el('div','Aisle '+(index+1),{class:'wh-aisle-label'}));
  var header=el('div',undefined,{class:'catalogue-row-header'});
  header.append(el(warehouse?'h2':'h3',title,{id:id+'-heading',class:warehouse?'':'shop-row-label'}));
  var arrows=el('div',undefined,{class:'catalogue-row-controls',hidden:''});
  var previous=el('button','←',{type:'button','aria-label':'Previous tools in '+title,'aria-controls':id+'-row'}),next=el('button','→',{type:'button','aria-label':'Next tools in '+title,'aria-controls':id+'-row'});
  arrows.append(previous,next);header.append(arrows);section.append(header);
  section.append(el('p',description,{class:warehouse?'wh-aisle-intro catalogue-row-intro':'catalogue-row-intro'}));
  var shelf=el('div',undefined,{class:(warehouse?'wh-aisle-row':'shop-row')+' catalogue-shelf',role:'list',tabindex:'0','aria-label':key==='quick'?title:title+' tools',id:id+'-row'});
  entries.forEach(function(item){shelf.append(cardFor(item,key));});
  if(!entries.length)shelf.append(el('p',key==='new'&&!search.value?(connection==='loading'?'Checking for tools published in the last 30 days…':connection==='partial'?'The latest listings could not be checked.':'No tools published in the last 30 days.'):'No matching tools in this row.',{class:'catalogue-empty'}));
  section.append(shelf);if(wrap){wrap.append(section);content.append(wrap);}else content.append(section);
  function sync(){var overflow=shelf.scrollWidth>shelf.clientWidth+2;arrows.hidden=!overflow;previous.disabled=!overflow||shelf.scrollLeft<=2;next.disabled=!overflow||shelf.scrollLeft+shelf.clientWidth>=shelf.scrollWidth-2;}
  previous.addEventListener('click',function(){scrollShelf(shelf,-1);});next.addEventListener('click',function(){scrollShelf(shelf,1);});
  shelf.addEventListener('scroll',sync,{passive:true});
  shelf.addEventListener('keydown',function(event){if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();scrollShelf(shelf,event.key==='ArrowRight'?1:-1);}});
  shelves.push(sync);requestAnimationFrame(sync);
 }
 function draw(){
  var words=search.value.toLowerCase().trim().split(/\s+/).filter(Boolean),matching=items.filter(function(item){return words.every(function(word){return [item.title,item.summary,item.kind].join(' ').toLowerCase().includes(word);});});
  content.replaceChildren();shelves=[];
  if(rowsMode){
   shelfFor('new','New','Published in the last 30 days · Quick tools and Dig in',matching.filter(isNew).sort(function(a,b){return publishedTime(b)-publishedTime(a);}),0);
   shelfFor('quick','Quick tools','Tools and downloads for a quick task.',matching.filter(function(item){return item.theme==='quick';}),1);
   shelfFor('dig','Dig in','Planners, assessments and guided work.',matching.filter(function(item){return item.theme==='dig';}),2);
  }else{
   filters.replaceChildren();[['all','All tools'],['quick','Quick tools'],['dig','Dig in']].forEach(function(pair){var count=items.filter(function(item){return pair[0]==='all'||item.theme===pair[0];}).length,b=el('button',pair[1]+' ('+count+')',{type:'button','aria-pressed':String(theme===pair[0])});b.addEventListener('click',function(){theme=pair[0];var url=new URL(location.href);if(theme==='all')url.searchParams.delete('theme');else url.searchParams.set('theme',theme);history.replaceState(null,'',url);draw();});filters.append(b);});
   matching=matching.filter(function(item){return theme==='all'||item.theme===theme;});matching.forEach(function(item){content.append(cardFor(item,'all'));});
   if(!matching.length)content.append(el('p','No matching tools. Try a different task or theme.'));
  }
  host.dataset.catalogueState=connection;
  status.textContent=matching.length+' of '+items.length+' distinct tools and downloads shown.'+(rowsMode?' New tools also appear in Quick tools or Dig in.':'')+(connection==='loading'?' Loading latest tools…':connection==='partial'?' Latest listings could not be loaded. Existing resources remain available.':'');
  document.dispatchEvent(new Event('warehouse-catalogue-updated'));
 }
 search.addEventListener('input',draw);search.addEventListener('search',draw);
 window.addEventListener('resize',function(){shelves.forEach(function(sync){sync();});});
 if(window.ResizeObserver)new ResizeObserver(function(){shelves.forEach(function(sync){sync();});}).observe(host);

 function replaceFallback(){
  if(mode==='shop'){
   var shop=document.getElementById('shop'),legacy=el('details',undefined,{class:'catalogue-legacy'});legacy.append(el('summary','Inline assessment versions'));
   ['sovcheck-embed','healthcheck-embed'].forEach(function(id){var node=document.getElementById(id);if(node){node.style.display='block';legacy.append(node);}});
   shop.querySelectorAll(':scope > .shop-row').forEach(function(row,index){if(index<2){var label=row.previousElementSibling;if(label&&label.classList.contains('shop-row-label'))label.remove();row.remove();}});
   var connected=document.getElementById('commons-shop-row-wrap');if(connected)connected.remove();shop.append(legacy);
  }
  if(mode==='warehouse'){
   document.querySelectorAll('.wh-aisle').forEach(function(aisle){if(aisle.contains(host)||host.contains(aisle))return;var heading=aisle.querySelector('h2');if(heading&&/Free Tools|Assessments & Checks/.test(heading.textContent)){aisle.closest('.wh-aisle-wrap').remove();}else{var label=aisle.querySelector('.wh-aisle-label'),number=label?.textContent.match(/^Aisle (\d+)$/);if(number)label.textContent='Aisle '+(Number(number[1])+1);}});
   var field=document.getElementById('aisle-field-wrap');if(field)field.remove();
  }
  if(mode==='full'){
   document.querySelectorAll('.tools-section').forEach(function(section){var details=el('details',undefined,{class:'catalogue-legacy'}),heading=section.querySelector('h2');details.append(el('summary','Inline '+(heading?heading.textContent:'assessment')));section.before(details);details.append(section);});
   function openHash(){var target=document.getElementById(location.hash.slice(1));if(target){var details=target.closest('details');if(details)details.open=true;target.scrollIntoView();}}openHash();window.addEventListener('hashchange',openHash);
  }
 }
 var endpoint=window.PHOENIX_TOOLS_ENDPOINT||'https://phoenix-node.netlify.app/.netlify/functions/public-mpa-tools';
 function read(url){return fetch(url,{cache:'no-store',signal:AbortSignal.timeout(15000)});}
 async function connectedTools(){var all=[],cursor=0;for(var page=0;page<100;page++){var url=new URL(endpoint,location.origin);url.searchParams.set('limit','100');url.searchParams.set('cursor',String(cursor));var response=await read(url);if(!response.ok)throw Error('unavailable');var data=await response.json();if(data.schema_version!=='phoenix-mpa-tools/v1'||!Array.isArray(data.items))throw Error('schema');all=all.concat(data.items);if(data.next_cursor===null||data.next_cursor===undefined)return all;if(!Number.isSafeInteger(data.next_cursor)||data.next_cursor<=cursor)throw Error('cursor');cursor=data.next_cursor;}throw Error('incomplete');}
 read('/data/tool-catalogue.json').then(function(response){if(!response.ok)throw Error('catalogue');return response.json();}).then(async function(data){
  if(data.schema!=='kamunity-tool-catalogue/v1'||!Array.isArray(data.items))throw Error('catalogue');items=data.items.filter(function(item){return item.id&&item.title&&safe(item.url)&&['quick','dig'].includes(item.theme);});replaceFallback();draw();
  try{var feed=await connectedTools();feed.forEach(function(tool){var artifact=tool.artifact||{},match=items.find(function(item){return item.phoenixToolId===tool.tool_id||normal(item.url)===normal(artifact.url);});var value={id:tool.tool_id||tool.id,title:tool.title,summary:tool.summary,url:artifact.url,publicUrl:tool.public_url,theme:tool.theme||'quick',kind:tool.tool_kind||'tool',maintenance:tool.maintenance,outputId:tool.id,createdAt:tool.created_at,publishedAt:tool.published_at};if(match)Object.assign(match,value);else if(!items.some(function(item){return item.id===value.id;}))items.push(value);});connection='ready';}catch(e){connection='partial';}draw();
  var target=location.hash?document.getElementById(location.hash.slice(1)):rowsMode&&theme!=='all'?host.querySelector('[data-catalogue-row="'+theme+'"]'):null;
  if(target)target.scrollIntoView({block:'start',inline:'nearest'});
 }).catch(function(){host.dataset.catalogueState='unavailable';status.textContent='The catalogue could not load. Existing links below remain available.';});
})();
