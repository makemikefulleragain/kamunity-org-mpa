import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {resolvePhoenixOrigin} from './phoenix-proxy.mjs';
const MPA='https://kamunity-org-mpa.netlify.app';
const escape=value=>String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const headers={'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
export function storyPage(template,story,origin='https://phoenix-node.netlify.app'){
  const canonical=MPA+'/news?story='+encodeURIComponent(story.id),description=String(story.summary||'').slice(0,300);
  const version=createHash('sha256').update(JSON.stringify([story.id,story.title,story.summary,story.body_text,story.source_url])).digest('hex').slice(0,24);
  const image=origin+'/.netlify/functions/public-story-image?story_id='+encodeURIComponent(story.id)+'&v='+version;
  let html=template.replace(/<title>[\s\S]*?<\/title>/i,()=>'<title>'+escape(story.title)+' — Kamunity News</title>')
    .replace(/<meta\s+(?:property="og:[^"]+"|name="(?:description|twitter:[^"]+)")[^>]*>\s*/g,'');
  const meta='<meta name="description" content="'+escape(description)+'">\n'+
    '<link rel="canonical" href="'+escape(canonical)+'">\n'+
    '<meta property="og:type" content="article">\n'+
    '<meta property="og:url" content="'+escape(canonical)+'">\n'+
    '<meta property="og:title" content="'+escape(story.title)+'">\n'+
    '<meta property="og:description" content="'+escape(description)+'">\n'+
    '<meta property="og:image" content="'+escape(image)+'">\n'+
    '<meta property="og:image:type" content="image/png">\n'+
    '<meta property="og:image:width" content="1200">\n'+
    '<meta property="og:image:height" content="630">\n'+
    '<meta property="og:image:alt" content="'+escape(story.title)+'">\n'+
    '<meta name="twitter:card" content="summary_large_image">\n';
  const seed=JSON.stringify(story).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
  html=html.replace('</head>',()=>meta+'</head>').replace('<body>',()=>'<body>\n<script type="application/json" id="kamunity-initial-story">'+seed+'</script>');
  // A useful, escaped original-source path remains available without JavaScript.
  const source=story.source_url&&safeSource(story.source_url);
  const fallback='<noscript><article class="hp-section-wrap"><h1>'+escape(story.title)+'</h1><p>'+escape(description)+'</p>'+String(story.body_text||'').split(/\n\n/).map(p=>'<p>'+escape(p)+'</p>').join('')+(source?'<p><a href="'+escape(source)+'" rel="noopener noreferrer">Open original source</a></p>':'')+'<p><a href="/news">All News</a></p></article></noscript>';
  return html.replace(/<main\b[^>]*>/i,main=>main+fallback);
}
function safeSource(value){try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:'';}catch{return '';}}
export function createNewsPage({load=()=>readFile(resolve('site/news.html'),'utf8'),fetchImpl=fetch,origin=event=>resolvePhoenixOrigin(event)}={}){return async event=>{
  if(!['GET','HEAD'].includes(event.httpMethod))return {statusCode:405,headers:{...headers,Allow:'GET, HEAD'},body:''};
  const template=await load(),id=event.queryStringParameters?.story;
  if(!id)return {statusCode:200,headers,body:event.httpMethod==='HEAD'?'':template};
  const unavailable=(code,message)=>({statusCode:code,headers:{...headers,'X-Robots-Tag':'noindex, nofollow',...(code===503?{'Retry-After':'60'}:{})},body:event.httpMethod==='HEAD'?'':'<!doctype html><html lang="en"><head><meta charset="utf-8"><title>'+message+' — Kamunity News</title></head><body><main><h1>'+message+'</h1><p><a href="/news">Browse Kamunity News</a></p></main></body></html>'});
  if(!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(id))return unavailable(404,'Story unavailable');
  const upstream=origin(event);if(!upstream)return unavailable(503,'News temporarily unavailable');
  try{
    const response=await fetchImpl(upstream+'/.netlify/functions/public-mpa-news?story_id='+encodeURIComponent(id),{headers:{accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(20000)});
    if(!response.ok)throw new Error('feed_unavailable');
    const payload=await response.json();if(payload?.schema_version!=='phoenix-mpa-news/v1'||!Array.isArray(payload.items))throw new Error('invalid_feed');
    const story=payload.items.find(item=>item.id===id);if(!story)return unavailable(404,'Story unavailable');
    if(typeof story.title!=='string'||typeof story.body_text!=='string')throw new Error('invalid_story');
    return {statusCode:200,headers,body:event.httpMethod==='HEAD'?'':storyPage(template,story,upstream)};
  }catch{return unavailable(503,'News temporarily unavailable');}
};}
export const handler=createNewsPage();
