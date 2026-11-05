const {chromium}=require('playwright');
const fs=require('fs'),http=require('http'),assert=require('assert');
(async()=>{
const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fs.readFileSync(__dirname+'/../index.html'));}).listen(8765,'127.0.0.1');
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:8765');await page.waitForFunction(()=>document.getElementById('tri').textContent==='16,200',{timeout:30000});
await page.locator('[data-scale="2"]').click();assert.equal(await page.locator('#scale').inputValue(),'2');
await page.locator('#scale').fill('0');assert.equal(await page.locator('#scale').getAttribute('aria-invalid'),'true');
await page.locator('#reset').click();assert.equal(await page.locator('#scale').inputValue(),'1');assert(await page.locator('#scale-error').isHidden());
for(const view of ['top','front','side','iso']){await page.locator(`[data-view="${view}"]`).click();assert.equal(await page.locator(`[data-view="${view}"]`).getAttribute('aria-pressed'),'true');}
await page.locator('#canvas').focus();await page.keyboard.press('ArrowLeft');await page.keyboard.press('+');
const ascii='solid test\nfacet normal 0 0 1\nouter loop\nvertex 0 0 0\nvertex 10 0 0\nvertex 0 10 1\nendloop\nendfacet\nendsolid test';
await page.locator('#file').setInputFiles({name:'test.stl',mimeType:'application/octet-stream',buffer:Buffer.from(ascii)});await page.waitForFunction(()=>document.getElementById('tri').textContent==='1');assert.equal(await page.locator('#dx').textContent(),'10');
const binary=Buffer.alloc(134);binary.writeUInt32LE(1,80);[0,0,1,0,0,0,20,0,0,0,20,2].forEach((v,i)=>binary.writeFloatLE(v,84+i*4));
await page.locator('#file').setInputFiles({name:'binary.stl',mimeType:'application/octet-stream',buffer:binary});await page.waitForFunction(()=>document.getElementById('dx').textContent==='20');
await page.locator('#file').setInputFiles({name:'invalid.txt',mimeType:'text/plain',buffer:Buffer.from('bad')});await page.waitForFunction(()=>!document.getElementById('error').hidden);assert.equal(await page.locator('#name').textContent(),'binary.stl');
await page.locator('#sample').click();await page.waitForFunction(()=>document.getElementById('tri').textContent==='16,200');
for(const width of [1440,768,390,320]){await page.setViewportSize({width,height:1000});await page.waitForTimeout(150);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width}`);const b=await page.locator('#canvas').boundingBox();assert(b.width>200&&b.height>=320);}
assert.deepEqual(errors,[]);console.log('PASS: sample, presets, invalid scale and recovery, four views, keyboard, ASCII/Binary STL, invalid file preserves model, responsive 1440/768/390/320, no runtime errors');
}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1)});
