const test = require('node:test');
const assert = require('node:assert/strict');
const {performance} = require('node:perf_hooks');
test('bounded catalog load and authentication rate limit',{skip:process.env.RUN_INTEGRATION!=='true'},async t=>{
  assert.match(process.env.DBNAME || new URL(process.env.DATABASE_URL).pathname,/cloudcampus_verify_/);
  const db=require('../src/config/db'),app=require('../src/app');
  const server=await new Promise(resolve=>{const instance=app.listen(0,'127.0.0.1',()=>resolve(instance));});
  const origin=`http://127.0.0.1:${server.address().port}`;
  t.after(async()=>{await new Promise(resolve=>server.close(resolve));await db.pool.end();});
  const durations=[];
  for(let batch=0;batch<13;batch++)await Promise.all(Array.from({length:Math.min(8,100-batch*8)},async()=>{
    const start=performance.now();const response=await fetch(origin+'/api/courses');assert.equal(response.status,200);const payload=await response.json();assert.ok(payload.data.length>=6);durations.push(performance.now()-start);
  }));
  durations.sort((a,b)=>a-b);
  console.log(JSON.stringify({check:'catalog-load',requests:durations.length,concurrency:8,p95_ms:Math.round(durations[94]),max_ms:Math.round(durations.at(-1))}));
  for(let i=0;i<31;i++){
    const response=await fetch(origin+'/api/auth/me');assert.equal(response.status,i<30?401:429);
    if(i===30)assert.equal((await response.json()).success,false);
  }
});
