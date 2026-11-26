import {readFile,writeFile} from 'node:fs/promises';
import {NEWS_TEMPLATE} from '../site/netlify/functions/_shared/news-template.mjs';
const html=await readFile('site/news.html','utf8');
if(process.argv.includes('--write'))await writeFile('site/netlify/functions/_shared/news-template.mjs','// Generated from site/news.html by scripts/sync-news-template.mjs.\nexport const NEWS_TEMPLATE='+JSON.stringify(html)+';\n');
else if(NEWS_TEMPLATE!==html)throw new Error('news_template_requires_sync');
