const {chromium}=require('playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');
(async()=>{
 const folder=fs.mkdtempSync(require('node:path').join(require('node:os').tmpdir(),'tigr-case-check-'));const profile=folder+'/profile-'+Date.now();const url=process.env.CHECK_URL||'http://localhost:8766/case-check/';
 const launch=()=>chromium.launchPersistentContext(profile,{headless:true,executablePath:process.env.CHROMIUM_PATH || undefined,viewport:{width:390,height:844}});
 let c=await launch(),p=await c.newPage();const errors=[],sent=[];p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(r.method()!=='GET')sent.push(r.url());});
 await p.goto(url);await p.evaluate(()=>document.fonts.ready);assert.equal(await p.locator('.question').count(),11);assert.equal(await p.locator('input:checked').count(),0);
 await p.screenshot({path:folder+'/mobile-top.png'});
 await p.locator('#workflow').fill('Eingangsanfragen vorprüfen');await p.locator('#waiting').fill('Bürgerservice wartet auf vollständige Unterlagen');
 for (const box of await p.locator('input[type=checkbox]').all()) await box.check();
 for(const [id,value] of Object.entries({period:'September 2026',cases:'200',minutes:'6,5',crosscheck:'System: 186; 14 Vorgänge offen',first:'Zehn geprüfte Cases testen',who:'Anna',when:'2026-10-05'}))await p.locator('#'+id).fill(value);
 for(let i=0;i<11;i++)await p.locator(`[name=q${i}][value="${['Ja','Nein','Offen'][i%3]}"]`).check();
 await p.locator('[name=decision][value=VORBEREITEN]').check();assert.match(await p.locator('#hours').textContent(),/21,67/);
 const saved=await p.evaluate(()=>localStorage.getItem('tigr.case-check.v1'));assert(saved);await p.reload();assert.equal(await p.locator('#workflow').inputValue(),'Eingangsanfragen vorprüfen');
 await c.close();c=await launch();p=await c.newPage();await p.goto(url);assert.equal(await p.evaluate(()=>localStorage.getItem('tigr.case-check.v1')),saved);
 const restored=await p.locator('form').evaluate(form=>Object.fromEntries([...form.querySelectorAll('input,textarea')].filter(f=>!['radio','checkbox'].includes(f.type)||f.checked).map(f=>[f.name,f.type==='checkbox'?f.checked:f.value])));
 const wanted=JSON.parse(saved).values;for(const [key,value] of Object.entries(wanted))assert.equal(restored[key],value,`restored ${key}`);
 await p.locator('#preview').evaluate(e=>e.open=true);const text=await p.locator('#export-text').inputValue();assert(text.includes('14 Vorgänge offen'));assert(text.includes('VORBEREITEN'));
 const downloadPromise=p.waitForEvent('download');await p.locator('#download').click();const download=await downloadPromise;await download.saveAs(folder+'/download.txt');assert.equal(fs.readFileSync(folder+'/download.txt','utf8'),text);
 for(const width of [320,390,768,1440]){await p.setViewportSize({width,height:900});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width}`);}
 await p.setViewportSize({width:390,height:844});await p.locator('.questions').first().scrollIntoViewIfNeeded();await p.screenshot({path:folder+'/mobile-questions.png'});
 await p.setViewportSize({width:1440,height:900});await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:folder+'/desktop.png'});
 await p.locator('#reset').click();await p.locator('#cancel-reset').click();assert.equal(await p.locator('#workflow').inputValue(),wanted.workflow);
 await p.locator('#reset').click();await p.locator('#confirm-reset').click();assert.equal(await p.locator('input:checked').count(),0);assert.equal(await p.evaluate(()=>localStorage.getItem('tigr.case-check.v1')),null);await p.reload();assert.equal(await p.locator('#workflow').inputValue(),'');
 for(const raw of ['broken JSON',JSON.stringify({version:1,values:{workflow:23}})]){await p.evaluate(raw=>localStorage.setItem('tigr.case-check.v1',raw),raw);await p.reload();assert.equal(await p.locator('#save-status').getAttribute('data-error'),'true');await p.locator('#workflow').fill('New unsaved entry');assert.equal(await p.evaluate(()=>localStorage.getItem('tigr.case-check.v1')),raw);await p.locator('#reset').click();await p.locator('#confirm-reset').click();}
 await p.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('Quota','QuotaExceededError')};});await p.reload();await p.locator('#workflow').fill('Quota test');assert.match(await p.locator('#save-status').textContent(),/Speichern nicht möglich/);assert((await p.locator('#export-text').inputValue()).includes('Quota test'));
 assert.deepEqual(errors,[]);assert.deepEqual(sent,[]);await c.close();console.log(JSON.stringify({result:'PASS',questions:11,initialEmpty:true,reload:true,completeBrowserRestart:true,allFields:true,download:true,resetCancelAndConfirm:true,corruptStorage:true,quotaFailure:true,overflowWidths:[320,390,768,1440],errors,sent,screenshots:folder},null,2));
})().catch(e=>{console.error(e);process.exit(1)});
