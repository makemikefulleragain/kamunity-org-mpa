/* One inventory for the Shop, Tools and Warehouse. No entered tool answers are read. */
(function(){
 'use strict';
 var host=document.querySelector('[data-tool-catalogue]');if(!host)return;
 var mode=host.dataset.toolCatalogue,query=new URLSearchParams(location.search),theme=['quick','dig'].includes(query.get('theme'))?query.get('theme'):'all';
 var items=[],connection='Loading connected tools…',search=document.getElementById('wh-search');
 function el(tag,text,attrs){var node=document.createElement(tag);if(text!==undefined)node.textContent=text;Object.entries(attrs||{}).forEach(function(pair){node.setAttribute(pair[0],pair[1]);});return node;}
 function normal(value){try{var u=new URL(value,location.origin);return u.origin+u.pathname.replace(/\/index\.html$/,'').replace(/\/$/,'')+u.search;}catch(e){return '';}}
 function safe(value){try{var u=new URL(value,location.origin);return u.protocol==='https:'||u.origin===location.origin?u.href:'';}catch(e){return '';}}
 var controls=el('div',undefined,{class:'catalogue-controls'}),filters=el('nav',undefined,{'aria-label':'Tool themes',class:'catalogue-filters'}),status=el('p','Loading tools…',{role:'status',class:'catalogue-status'}),list=el('div',undefined,{class:'catalogue-grid',role:'list'});
 if(!search){var label=el('label','Find a tool or download');search=el('input',undefined,{type:'search','aria-label':'Find a tool or download',placeholder:'Search tasks, titles or tool types'});label.append(search);controls.append(label);}
 controls.append(filters);host.append(controls,status,list);
 function draw(){
  filters.replaceChildren();[['all','All tools'],['quick','Quick tools'],['dig','Dig in']].forEach(function(pair){var count=items.filter(function(item){return pair[0]==='all'||item.theme===pair[0];}).length,b=el('button',pair[1]+' ('+count+')',{type:'button','aria-pressed':String(theme===pair[0])});b.addEventListener('click',function(){theme=pair[0];var url=new URL(location.href);if(theme==='all')url.searchParams.delete('theme');else url.searchParams.set('theme',theme);history.replaceState(null,'',url);draw();});filters.append(b);});
  var words=search.value.toLowerCase().trim().split(/\s+/).filter(Boolean),shown=items.filter(function(item){return(theme==='all'||item.theme===theme)&&words.every(function(word){return [item.title,item.summary,item.kind].join(' ').toLowerCase().includes(word);});});
  list.replaceChildren();shown.forEach(function(item){var card=el('article',undefined,{class:'catalogue-card wh-tool-card','data-search':[item.title,item.summary,item.kind].join(' '),role:'listitem','data-tool-id':item.id});
   if(item.outputId)card.id='phoenix-'+item.outputId;
   card.append(el('p',(item.theme==='quick'?'Quick tools':'Dig in')+' · '+item.kind,{class:'catalogue-kind'}),el('h3',item.title),el('p',item.summary));
   if(item.maintenance)card.append(el('p','Maintainer: '+item.maintenance.maintainer+' · '+item.maintenance.version+' · Review due '+item.maintenance.next_review_due,{class:'wh-phoenix-maintenance'}));
   else card.append(el('p',item.reviewStatus||'Review date not recorded',{class:'catalogue-status'}));
   var href=safe(item.publicUrl||item.url);if(href)card.append(el('a',item.kind==='handout'||item.kind==='template'?'Open or download':'Open tool',{href:href,class:'shop-btn'}));list.append(card);
  });status.textContent=shown.length+' of '+items.length+' tools and downloads shown. '+connection;
  if(!shown.length)list.append(el('p','No matching tools. Try a different task or theme.'));
 }
 search.addEventListener('input',draw);
 function replaceFallback(){
  if(mode==='shop'){
   var shop=document.getElementById('shop'),legacy=el('details',undefined,{class:'catalogue-legacy'});legacy.append(el('summary','Inline assessment versions'));
   ['sovcheck-embed','healthcheck-embed'].forEach(function(id){var node=document.getElementById(id);if(node){node.style.display='block';legacy.append(node);}});
   shop.querySelectorAll(':scope > .shop-row').forEach(function(row,index){if(index<2){var label=row.previousElementSibling;if(label&&label.classList.contains('shop-row-label'))label.remove();row.remove();}});
   var connected=document.getElementById('commons-shop-row-wrap');if(connected)connected.remove();shop.append(legacy);
  }
  if(mode==='warehouse'){
   document.querySelectorAll('.wh-aisle').forEach(function(aisle){if(aisle.contains(host))return;var heading=aisle.querySelector('h2');if(heading&&/Free Tools|Assessments & Checks/.test(heading.textContent))aisle.remove();});
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
  try{var feed=await connectedTools();feed.forEach(function(tool){var artifact=tool.artifact||{},match=items.find(function(item){return item.phoenixToolId===tool.tool_id||normal(item.url)===normal(artifact.url);});var value={id:tool.tool_id||tool.id,title:tool.title,summary:tool.summary,url:artifact.url,publicUrl:tool.public_url,theme:tool.theme||'quick',kind:tool.tool_kind||'tool',maintenance:tool.maintenance,outputId:tool.id};if(match)Object.assign(match,value);else if(!items.some(function(item){return item.id===value.id;}))items.push(value);});connection='Current connected listings loaded.';}catch(e){connection='Connected listings could not be loaded. Existing catalogue resources remain available.';}draw();
  if(location.hash.indexOf('#phoenix-')===0){var target=document.getElementById(location.hash.slice(1));if(target)target.scrollIntoView();}
 }).catch(function(){status.textContent='The catalogue could not load. Existing links below remain available.';});
})();
