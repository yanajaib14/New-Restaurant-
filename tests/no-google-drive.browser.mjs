// Verify the removed integration stays absent and note downloads still work.
import assert from 'node:assert/strict';
import {loadPlaywright} from './playwright.mjs';
const {chromium}=await loadPlaywright();
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
const driveRequests=[],errors=[];let writes=0;
const fileText='Isolated attachment download fixture';
const fileName='layout-attachment.txt';
const note={id:9701,title:'Drive removal test note',body:'Local attachment download remains available.',date:'2026-11-13',tag:'General',files:[{id:9702,name:fileName,type:'text/plain',size:Buffer.byteLength(fileText),url:`data:text/plain;base64,${Buffer.from(fileText).toString('base64')}`}]};
const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true,serviceWorkers:'block'});
await context.routeWebSocket('**/*',()=>{});
await context.route('**/*',async route=>{
 const request=route.request(),url=new URL(request.url());
 if(/^\/api\/(auth\/google|drive)(\/|$)/.test(url.pathname)||url.pathname==='/auth/google/callback') {driveRequests.push(url.pathname);return route.abort();}
 if(url.hostname==='127.0.0.1'&&url.pathname.startsWith('/api/')){
  if(request.method()!=='GET'){writes++;return route.fulfill({status:405,json:{error:'Read-only layout fixture'}});}
  if(url.pathname.startsWith('/api/records/'))return route.fulfill({json:url.pathname.endsWith('/notes')?[note]:[]});
  return route.fulfill({json:url.pathname==='/api/settings/title'?{ok:true,title:'Glai Gung Won'}:{ok:true,allowed:true,users:[]}});
 }
 if(url.hostname==='127.0.0.1')return route.continue();
 return route.abort();
});
try{
 const page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'PLANNING',exact:true}).click();
 await page.getByRole('button',{name:'Notes',exact:true}).first().click();
 await page.getByText(note.title,{exact:true}).click();
 const dialog=page.getByRole('dialog');await dialog.waitFor();
 assert.equal(await page.getByRole('button',{name:/Connect Drive|Save to Drive/}).count(),0);
 assert.equal(await page.getByTitle('Save to Drive',{exact:true}).count(),0);
 const downloaded=page.waitForEvent('download');
 await dialog.getByRole('link',{name:fileName,exact:true}).click();
 const download=await downloaded;assert.equal(download.suggestedFilename(),fileName);
 const stream=await download.createReadStream();let actual='';for await(const chunk of stream)actual+=chunk.toString();assert.equal(actual,fileText);
 assert.deepEqual(driveRequests,[]);assert.equal(writes,0);assert.deepEqual(errors,[]);
 console.log('PASS: no Drive controls or OAuth/status/save requests; existing note attachment downloads with original filename and contents; no business writes.');
}finally{await context.close();await browser.close();}
