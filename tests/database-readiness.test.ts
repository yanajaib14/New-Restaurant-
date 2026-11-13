import test from 'node:test';
import assert from 'node:assert/strict';
import {createDatabaseReadinessHandler} from '../server/readiness';
const invoke=async(pool:any)=>{
 const response={code:200,body:null as any,status(code:number){this.code=code;return this;},json(body:any){this.body=body;return this;}};
 await createDatabaseReadinessHandler(()=>pool)({} as any,response as any,()=>{});return response;
};
test('readiness is unavailable without a connection instead of claiming ready',async()=>assert.equal((await invoke(null)).code,503));
test('readiness distinguishes missing schema from a healthy installed database',async()=>{
 const empty=await invoke({query:async()=>({rows:[]})});assert.equal(empty.code,503);assert.equal(empty.body.status,'schema_required');
 const names=['tasks','task_todos','notes','calendar_events','team_onboarding','shopping_list_items'];
 const ready=await invoke({query:async()=>({rows:names.map(table_name=>({table_name}))})});assert.equal(ready.code,200);assert.equal(ready.body.status,'ready');
});
test('connection errors never expose connection details',async()=>{
 const result=await invoke({query:async()=>{throw Error('postgres://fixture:secret@private.test/db');}});assert.equal(result.code,503);assert.doesNotMatch(JSON.stringify(result.body),/secret|private/);
});
