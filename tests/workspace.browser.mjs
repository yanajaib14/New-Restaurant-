// All business APIs are intercepted. No production data is read or changed.
import assert from 'node:assert/strict';
const {chromium} = await import(process.env.PLAYWRIGHT_MODULE || '/workspace/.onboarding-tools/node_modules/playwright/index.mjs');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args:['--no-sandbox'] });
const tables = {}; let nextId = 100, failedTable = '', offlineTodos = false, holdTable = '', releaseWrite;
let failedReadTable = '';
let title = 'Glai Gung Won'; let titleFail = false; const writes = [], pageErrors = [], unexpectedHosts = new Set();
const cors = {'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'GET,POST,PATCH,DELETE,OPTIONS'};
const context = await browser.newContext({viewport:{width:1440,height:1000}});
const handleRoute = async route => {
  const req = route.request(), url = new URL(req.url()), method = req.method();
  const fulfill = (json, status=200) => route.fulfill({json,status,headers:cors});
  if (url.pathname.startsWith('/api/records/')) {
    const table = url.pathname.split('/').pop(); tables[table] ||= [];
    if(method === 'OPTIONS') return fulfill({});
    if(table === 'task_todos' && offlineTodos) return fulfill({message:'Test connection unavailable'},503);
    let rows = tables[table]; const id = url.searchParams.get('id')?.replace(/^eq\./,'');
    if(method === 'GET' && failedReadTable===table) return fulfill({message:'Fixture read failed'},503);
    if(method === 'GET') return fulfill(id ? rows.filter(row=>String(row.id)===id) : rows);
    if(holdTable===table) await new Promise(resolve => { releaseWrite=resolve; });
    if(failedTable===table) return fulfill({message:'Fixture write rejected'},403);
    const payload = req.postDataJSON(); writes.push({table,method,id,payload});
    if(method === 'POST') { const inserted=(Array.isArray(payload)?payload:[payload]).map(row=>({id:nextId++,...row})); tables[table].push(...inserted); return fulfill(inserted,201); }
    if(method === 'PATCH') { tables[table]=rows.map(row=>String(row.id)===id?{...row,...payload}:row); return fulfill(tables[table].filter(row=>String(row.id)===id)); }
    if(method === 'DELETE') { tables[table]=rows.filter(row=>String(row.id)!==id); return fulfill([]); }
  }
  if(url.hostname==='127.0.0.1' && url.pathname.startsWith('/api/')) {
    if(url.pathname==='/api/settings/title') { if(method==='POST'){if(titleFail)return fulfill({error:'Fixture settings unavailable'},503);title=req.postDataJSON().title;} return fulfill({ok:true,title}); }
    if(url.pathname==='/api/ai/chat')return fulfill({text:'Suggested task:\n@B review fixture delivery by Friday'});
    if(url.pathname==='/api/db/select')return fulfill({ok:true,rows:tables[url.searchParams.get('table')] || []});
    return fulfill({ok:true,allowed:true,users:[],connected:false});
  }
  if(url.hostname==='127.0.0.1')return route.continue();
  unexpectedHosts.add(url.hostname); return route.abort();
};
await context.routeWebSocket('**/*', ws => {});
await context.route('**/*',handleRoute);
const page=await context.newPage(); page.setDefaultTimeout(8000);
page.on('pageerror', e=>pageErrors.push(e.message)); page.on('dialog',d=>d.accept());
const body = () => page.locator('body').innerText();
const wait = async (fn,label) => { const until=Date.now()+8000; while(Date.now()<until){if(await fn())return;await new Promise(r=>setTimeout(r,60));}throw Error('Timed out: '+label); };
const button=(name)=>page.getByRole('button',{name,exact:true});
const nav=async(group,name)=>{await button(group).click();if(name)await button(name).first().click();};
const reload=async()=>{await page.reload({waitUntil:'networkidle'});};
let passed=0;
async function scenario(name,fn){await fn();passed++;console.log('PASS '+name);}
try {
await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
await scenario('successful empty task/note/checklist/todo reads clear stale browser backups',async()=>{
 await page.evaluate(()=>{for(const key of ['restaurant_tasks_v1','restaurant_notes_v1','restaurant_daily_checklists_v1','restaurant_task_todos_v1'])localStorage.setItem(key,JSON.stringify([{id:99,title:'Stale fixture',task:'Stale fixture',category:'Operations',status:'Not Started',checklist:[],items:[]}]))});
 await reload(); await wait(async()=>page.evaluate(()=>['restaurant_tasks_v1','restaurant_notes_v1','restaurant_daily_checklists_v1','restaurant_task_todos_v1'].every(k=>localStorage.getItem(k)==='[]')),'authoritative empty reads');
});
await scenario('failed task read retains backup and visibly reports incomplete workspace data',async()=>{
 await page.evaluate(()=>localStorage.setItem('restaurant_tasks_v1',JSON.stringify([{id:98,task:'Cached fixture task',due:'',priority:'Low',category:'Operations',status:'Not Started',checklist:[]}])));
 failedReadTable='tasks';await reload();await nav('PLANNING','Tasks');assert.match(await body(),/Some workspace lists could not load/);assert.match(await body(),/Cached fixture task/);
 failedReadTable='';await button('Retry workspace load').click();await wait(async()=>!(await body()).includes('Some workspace lists could not load'),'workspace retry');
 assert.doesNotMatch(await body(),/Cached fixture task/);
});
await scenario('todo read failure keeps queued change through reload, retry shares it once',async()=>{
 offlineTodos=true; await reload(); await nav('PLANNING','Tasks');
 await page.getByPlaceholder('Quick-add todo...').fill('Queued fixture todo');
 // Quick add sits beside the title input; press its explicit + Add button.
 await page.getByPlaceholder('Quick-add todo...').locator('..').getByRole('button',{name:'+ Add',exact:true}).click();
 await wait(async()=> (await body()).includes('Pending — only on this device'),'pending label');
 await reload();await nav('PLANNING','Tasks');assert.match(await body(),/Queued fixture todo/);
 offlineTodos=false;await button('Retry todo sync').click();await wait(()=>tables.task_todos?.length===1,'shared insert');
 await wait(async()=>!(await body()).includes('Pending — only on this device'),'acknowledged');
 await reload();await nav('PLANNING','Tasks');assert.match(await body(),/Queued fixture todo/);assert.equal(tables.task_todos.length,1);
});
await scenario('separate browser storage sees shared todos and sends status updates',async()=>{
 const other=await browser.newContext({viewport:{width:1440,height:1000}});await other.routeWebSocket('**/*',ws=>{});await other.route('**/*',handleRoute);
 try {
  const partner=await other.newPage();partner.on('pageerror',e=>pageErrors.push(e.message));
  await partner.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});await partner.getByRole('button',{name:'Tasks',exact:true}).click();
  await partner.getByRole('button',{name:'Complete todo: Queued fixture todo',exact:true}).click();
  await wait(()=>tables.task_todos[0].status==='Done','partner status write');
  // A fresh read in the first browser must observe the other browser's write.
  await reload();await nav('PLANNING','Tasks');await page.getByRole('button',{name:'Reopen todo: Queued fixture todo',exact:true}).waitFor();
 } finally {await other.close();}
});
await scenario('master task draft survives rejection; pending save cannot duplicate or dismiss',async()=>{
 await button('+ New Master Task').click();const dialog=page.getByRole('dialog');
 await dialog.getByLabel('TASK NAME').fill('Master fixture task');
 failedTable='tasks';await dialog.getByRole('button',{name:'Create Task',exact:true}).click();
 await wait(async()=> (await dialog.innerText()).includes('not saved'),'failure retained');assert.equal(await dialog.getByLabel('TASK NAME').inputValue(),'Master fixture task');
 failedTable='';holdTable='tasks';await dialog.getByRole('button',{name:'Create Task',exact:true}).click();
 await wait(()=>!!releaseWrite,'pending backend');await dialog.getByRole('button',{name:/Close/}).click();assert.equal(await dialog.count(),1);
 holdTable='';releaseWrite();releaseWrite=undefined;
 await wait(async()=>await dialog.count()===0,'saved task close');assert.equal(tables.tasks.length,1);await reload();await nav('PLANNING','Tasks');assert.match(await body(),/Master fixture task/);
});
await scenario('QuickBooks placeholder has no bookkeeping controls or invented figures',async()=>{
 await nav('FINANCIALS','QuickBooks');assert.match(await body(),/QuickBooks — coming later/);
 assert.equal(await page.locator('[data-slot="quickbooks-link"]').innerText(),'');
 assert.equal(await page.locator('[data-slot="quickbooks-summary"]').innerText(),'');
 assert.equal(await page.getByRole('button',{name:/Import Invoice|Upload Receipt/}).count(),0);
});
await scenario('settings title failure retains input; retry persists after reload',async()=>{
 await nav('DASHBOARD','Settings');const digits=page.locator('input[inputmode="numeric"]');
 for(const [i,n] of [...'1379'].entries())await digits.nth(i).fill(n);
 await page.getByPlaceholder('Restaurant name').fill('Workspace fixture name');
 titleFail=true;await button('Save Title').click();await wait(async()=> (await body()).includes('Fixture settings unavailable'),'title failure');
 assert.equal(await page.getByPlaceholder('Restaurant name').inputValue(),'Workspace fixture name');
 titleFail=false;await button('Save Title').click();await wait(()=>title==='Workspace fixture name','title save');
 await reload();assert.match(await body(),/Workspace fixture name/);
});
await scenario('AI proposed task never says Added on a rejected creation; retry creates once',async()=>{
 await nav('DASHBOARD','AI Assistant');await page.getByPlaceholder('Ask about tasks, budget, menu, timeline...').fill('Suggest a fixture task');await button('Send').click();
 const proposal=page.getByRole('button',{name:/Add task:.*review fixture delivery/i});
 await proposal.waitFor();failedTable='tasks';await proposal.click();await wait(async()=> (await body()).includes('Could not add task'),'proposal error');
 assert.equal(await page.getByRole('button',{name:/Added:.*review fixture delivery/i}).count(),0);
 failedTable='';await proposal.click();await page.getByRole('button',{name:/Added:.*review fixture delivery/i}).waitFor();
 assert.equal(tables.tasks.filter(row=>row.task==='Review fixture delivery').length,1);
});
await scenario('duplicate shopping names update by ID and reject negative quantities',async()=>{
 tables.shopping_list_items=[{id:501,name:'Duplicate fixture',category:'Operating Supplies',department:'Kitchen',quantity:1,unit:'each',totalCost:2,items:''},{id:502,name:'Duplicate fixture',category:'Operating Supplies',department:'Kitchen',quantity:2,unit:'each',totalCost:4,items:''}];
 await reload();await nav('OPERATIONS','Shopping List');
 await page.getByTitle('Edit',{exact:true}).nth(1).click();const dialog=page.getByRole('dialog');
 await dialog.getByLabel('QUANTITY').fill('-2');await dialog.getByRole('button',{name:'Save Item',exact:true}).click();await wait(async()=> (await dialog.innerText()).includes('nonnegative'),'numeric rejection');
 assert.equal(tables.shopping_list_items[1].quantity,2);
 await dialog.getByLabel('QUANTITY').fill('7');failedTable='shopping_list_items';await dialog.getByRole('button',{name:'Save Item',exact:true}).click();await wait(async()=> (await dialog.innerText()).includes('Fixture write rejected'),'shopping failure');
 failedTable='';await dialog.getByRole('button',{name:'Save Item',exact:true}).click();await wait(async()=>await dialog.count()===0,'shopping save');
 assert.equal(tables.shopping_list_items[0].quantity,1);assert.equal(tables.shopping_list_items[1].quantity,7);await reload();await nav('OPERATIONS','Shopping List');assert.match(await body(),/7 each/);
});
await scenario('menu ingredient suppression survives reload and can be restored',async()=>{
 tables.menu_items=[{id:601,name:'Fixture dish',section:'Small Plates',desc:'Test fixture',price:20,foodCost:30,hero:false,notes:'',ingredients:[{id:1,name:'Fixture ingredient',quantity:2,unit:'each',cost:3}]}];
 await reload();await nav('OPERATIONS','Shopping List');
 const name=page.getByText('Fixture ingredient',{exact:true});await name.locator('..').getByTitle('Delete',{exact:true}).click();
 await wait(()=>tables.shopping_list_items.some(row=>row.removed===true),'persisted suppression');
 await reload();await nav('OPERATIONS','Shopping List');assert.equal(await page.getByText('Fixture ingredient',{exact:true}).count(),0);
 await page.getByRole('button',{name:/Restore removed menu ingredients/}).click();await page.getByText('Fixture ingredient',{exact:true}).waitFor();
});
await scenario('costing retains failed edits and retries without repeated inserts',async()=>{
 await nav('KITCHEN','Cost Calculator');await page.getByRole('button',{name:/Fixture dish/}).click();const numbers=page.locator('input[type="number"]');
 failedTable='cost_calculator_overrides';await numbers.nth(0).fill('25');await wait(async()=> (await body()).includes('Retry'),'cost failure');assert.equal(await numbers.nth(0).inputValue(),'25');
 failedTable='';await button('Retry').click();await wait(()=>tables.cost_calculator_overrides?.length===1,'cost insert');
 await numbers.nth(0).fill('26');await numbers.nth(1).fill('32');await wait(()=>tables.cost_calculator_overrides[0].price===26&&tables.cost_calculator_overrides[0].targetFoodCost===32,'serial cost edits');
 assert.equal(tables.cost_calculator_overrides.length,1);await reload();await nav('KITCHEN','Cost Calculator');await page.getByRole('button',{name:/Fixture dish/}).click();assert.equal(await page.locator('input[type="number"]').nth(0).inputValue(),'26');
});
console.log(JSON.stringify({passed,pageErrors,externalRequestsBlocked:[...unexpectedHosts]},null,2));
assert.deepEqual(pageErrors,[]);
} finally {await browser.close();}
