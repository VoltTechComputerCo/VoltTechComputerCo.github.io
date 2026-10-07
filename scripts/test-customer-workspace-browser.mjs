import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)('playwright');
const job={id:'00000000-0000-4000-8000-000000000001',kind:'store',reference:'VT-QA-1',title:'Hardware order',stage:'awaiting_payment',payment_status:'unpaid',approval:'accepted',total:3100,stock:true,quote:true,href:'/order-status.html?id=00000000-0000-4000-8000-000000000001',latest_update:'Your approved quote is ready for payment.'};
for(const width of [390,1440]){
 const browser=await chromium.launch({headless:true,executablePath:process.env.VT_CHROMIUM_PATH,args:['--no-sandbox','--single-process','--no-zygote','--disable-gpu']});const page=await browser.newPage({viewport:{width,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/account.html?inspect=1');
 await page.setContent('<link rel="stylesheet" href="/assets/css/components/customer-workflow.css"><style>body{background:#061c20;color:white;font:16px Arial;margin:16px}</style><main id="workspace"></main>');
 await page.evaluate(async job=>{const {renderCustomerWorkflow}=await import('/assets/js/components/customer-workflow.js');await renderCustomerWorkflow({rpc:async()=>({data:[job]})},document.querySelector('#workspace'));},job);
 assert.equal(await page.locator('.customer-job').count(),1);assert.match(await page.locator('.customer-job-next').innerText(),/Open payment portal/);assert.ok((await page.locator('a').getAttribute('href')).includes('?id='));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);await page.screenshot({path:`qa-results/operations/workspace-${width}.png`,fullPage:true});console.log('PASS: customer account workspace, latest update, payment next action and no overflow at '+width);await browser.close();
}
