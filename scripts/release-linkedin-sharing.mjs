import {execFileSync} from 'node:child_process';
import {mkdtemp,mkdir,writeFile} from 'node:fs/promises';
const site='3a8ddd3d-52f0-4a33-adf5-862bbbf8bf51',expected=process.argv[2];
if(!expected)throw new Error('Pass the observed current deployment ID');
if(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim())throw new Error('release_requires_clean_source');
const commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const cli=(args,cwd=process.cwd())=>JSON.parse(execFileSync('netlify',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:600000,maxBuffer:10*1024*1024,env:{...process.env,CI:'1',NETLIFY_CLI_DISABLE_UPDATE_CHECK:'1'}}));
const api=(name,data)=>cli(['api',name,'--data',JSON.stringify(data)]);
const before=api('getSite',{site_id:site});if(before.published_deploy.id!==expected||before.name!=='kamunity-org-mpa')throw new Error('production_changed_before_release');
const locked=before.published_deploy.locked===true,stage=await mkdtemp('/private/tmp/mpa-linkedin-release-');
execFileSync('tar',['-x','-C',stage],{input:execFileSync('git',['archive','--format=tar','HEAD'],{maxBuffer:50*1024*1024})});
let release;
try{
 if(locked)api('unlockDeploy',{deploy_id:expected});
 release=cli(['deploy','--site',site,'--prod','--no-build','--dir','site','--functions','site/netlify/functions','--json'],stage);
 await mkdir('output/health',{recursive:true});await writeFile('output/health/linkedin-mpa-release.json',JSON.stringify({site,sourceCommit:commit,previous:expected,...release},null,2)+'\n');
 const feed=await(await fetch('https://phoenix-node.netlify.app/.netlify/functions/public-mpa-news?limit=1',{signal:AbortSignal.timeout(25000)})).json();const story=feed.items?.[0];if(!story)throw new Error('public_story_required');
 const response=await fetch('https://kamunity-org-mpa.netlify.app/news?story='+story.id,{signal:AbortSignal.timeout(30000)}),html=await response.text();
 if(!response.ok||!html.includes('id="kamunity-initial-story"')||!html.includes('property="og:image"')||!html.includes('rel="canonical"'))throw new Error('live_sharing_metadata_failed');
 const imageUrl=html.match(/property="og:image" content="([^"]+)"/)?.[1]?.replaceAll('&amp;','&');if(!imageUrl?.startsWith('https://phoenix-node.netlify.app/'))throw new Error('unexpected_preview_image_origin');
 const image=await fetch(imageUrl,{signal:AbortSignal.timeout(25000)}),png=Buffer.from(await image.arrayBuffer());if(!image.ok||png.readUInt32BE(16)!==1200||png.readUInt32BE(20)!==630)throw new Error('live_preview_image_failed');
 await writeFile('output/health/linkedin-mpa-readback.json',JSON.stringify({ok:true,deployId:release.deploy_id,storyId:story.id,metadataInInitialHtml:true,image:{width:1200,height:630,bytes:png.length}},null,2)+'\n');console.log(JSON.stringify({released:true,deployId:release.deploy_id,previous:expected,sourceCommit:commit}));
}catch(error){if(release?.deploy_id)api('restoreSiteDeploy',{site_id:site,deploy_id:expected});throw error;}
finally{if(locked){const current=api('getSite',{site_id:site});api('lockDeploy',{deploy_id:current.published_deploy.id});}}
