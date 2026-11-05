const {chromium}=require('playwright');
const fs=require('fs'),http=require('http'),assert=require('assert');

(async()=>{
 // Instrument the real renderer in the test response only; production exposes no counters.
 const source=fs.readFileSync(__dirname+'/../index.html','utf8').replace(
  'renderer.setPixelRatio(1);',
  `renderer.setPixelRatio(1);
  window.renderTimes=[];
  const originalRender=renderer.render.bind(renderer);
  renderer.render=(...args)=>{window.renderTimes.push(performance.now());return originalRender(...args);};`
 );
 const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(source);}).listen(8766,'127.0.0.1');
 let browser;
 try{
  browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:1280,height:900},deviceScaleFactor:2});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8766');
  await page.waitForFunction(()=>window.renderTimes?.length>0);
  await page.waitForTimeout(1500);
  const count=await page.evaluate(()=>renderTimes.length);
  await page.waitForTimeout(1000);
  assert.equal(await page.evaluate(()=>renderTimes.length),count,'Idle must stop drawing');
  assert(await page.evaluate(()=>document.querySelector('canvas').width<=document.querySelector('canvas').clientWidth+1),'DPR capped at 1');

  await page.locator('#auto').uncheck();
  await page.evaluate(async()=>{
   window.renderTimes=[];window.burstStart=performance.now();
   for(let i=0;i<120;i++){
    const input=document.getElementById('range');input.value=String(i/120);
    input.dispatchEvent(new Event('input',{bubbles:true}));
    await new Promise(resolve=>setTimeout(resolve,8));
   }
  });
  await page.waitForTimeout(100);
  const times=await page.evaluate(()=>renderTimes);
  const duration=await page.evaluate(()=>performance.now()-burstStart);
  assert(times.length>0&&times.length<120,`120 updates should coalesce; got ${times.length} frames`);
  assert(times.length<=Math.ceil(duration*30/1000)+1,'Average draw rate must stay below 30 FPS');
  const minInterval=Math.min(...times.slice(1).map((time,i)=>time-times[i]));
  // Allow a few milliseconds for requestAnimationFrame timestamp / instrumentation jitter.
  assert(minInterval>=30,`30 FPS cap: minimum interval ${minInterval}ms`);

  async function redraw(action){
   const before=await page.evaluate(()=>renderTimes.length);
   await action();await page.waitForFunction(n=>renderTimes.length>n,before);
  }
  await redraw(()=>page.locator('[data-view="top"]').click());
  await redraw(()=>page.locator('#reset').click());
  await redraw(async()=>{await page.locator('#canvas').focus();await page.keyboard.press('ArrowLeft');});
  await redraw(()=>page.setViewportSize({width:390,height:900}));
  await redraw(()=>page.locator('#sample').click());
  const stl='solid test\nfacet normal 0 0 1\nouter loop\nvertex 0 0 0\nvertex 10 0 0\nvertex 0 10 1\nendloop\nendfacet\nendsolid test';
  await redraw(()=>page.locator('#file').setInputFiles({name:'test.stl',mimeType:'application/octet-stream',buffer:Buffer.from(stl)}));
  assert.equal(await page.locator('#tri').textContent(),'1');
  // Exercise the hidden/visible lifecycle deterministically in headless Chromium.
  await page.evaluate(()=>{
   Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});
   document.dispatchEvent(new Event('visibilitychange'));
  });
  const hiddenCount=await page.evaluate(()=>renderTimes.length);
  await page.locator('[data-scale="2"]').click();await page.waitForTimeout(200);
  assert.equal(await page.evaluate(()=>renderTimes.length),hiddenCount,'Hidden must not draw');
  await redraw(()=>page.evaluate(()=>{
   delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));
  }));
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({idleFramesPerSecond:0,burstUpdates:120,burstFrames:times.length,minFrameIntervalMs:Math.round(minInterval*10)/10,devicePixelRatioCap:1,redrawAndVisibilityChecks:'PASS'}));
 }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1);});
