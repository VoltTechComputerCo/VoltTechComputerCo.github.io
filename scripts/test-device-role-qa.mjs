import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const base = (process.env.VT_QA_BASE || 'http://127.0.0.1:4173').replace(/\/+$/, '');
const baseOrigin = new URL(base).origin;
const outDir = path.resolve('qa-results/step-9.2');
fs.mkdirSync(outDir, { recursive: true });

const viewports = [
  { name:'mobile-360', width:360, height:800, isMobile:true, hasTouch:true },
  { name:'tablet-768', width:768, height:1024, isMobile:false, hasTouch:true },
  { name:'desktop-1024', width:1024, height:900, isMobile:false, hasTouch:false },
  { name:'desktop-1440', width:1440, height:1000, isMobile:false, hasTouch:false },
];

const representative = [
  { name:'home', path:'index.html' },
  { name:'repair', path:'pc-repair-pretoria.html' },
  { name:'signal', path:'signal-scan.html?source=repair&issue=boot' },
  { name:'static', path:'static.html' },
  { name:'account-inspection', path:'account.html?inspect=1' },
];

const results = [];
let failures = 0;

function record(name, status, detail = '') {
  results.push({ name, status, detail });
  if (status === 'FAIL') failures += 1;
  console.log(`${status}: ${name}${detail ? ` — ${detail}` : ''}`);
}

async function run(name, fn) {
  try {
    await fn();
    record(name, 'PASS');
  } catch (error) {
    record(name, 'FAIL', error?.message || String(error));
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function makeContext(browser, spec) {
  const context = await browser.newContext({
    viewport: { width: spec.width, height: spec.height },
    isMobile: spec.isMobile,
    hasTouch: spec.hasTouch,
    deviceScaleFactor: 1,
    serviceWorkers: 'block',
    colorScheme: 'dark',
    reducedMotion: 'reduce',
  });
  await context.route('**/*', route => {
    const requestUrl = new URL(route.request().url());
    if (requestUrl.origin === baseOrigin) return route.continue();
    return route.abort();
  });
  return context;
}

async function open(page, rel) {
  const response = await page.goto(`${base}/${rel}`, { waitUntil:'domcontentloaded', timeout:15000 });
  assert(response && response.ok(), `${rel}: HTTP ${response?.status() ?? 'no response'}`);
  await page.waitForTimeout(120);
  const main = page.locator('main').first();
  assert(await main.count() === 1, `${rel}: main landmark missing`);
}

async function assertNoHorizontalOverflow(page, label) {
  const size = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
    bodyScroll: document.body?.scrollWidth || 0,
  }));
  assert(size.scroll <= size.viewport + 2, `${label}: document overflow ${size.scroll}px > ${size.viewport}px`);
  assert(size.bodyScroll <= size.viewport + 2, `${label}: body overflow ${size.bodyScroll}px > ${size.viewport}px`);
}

async function assertNavigation(page, spec, label) {
  const nav = page.locator('#primary-navigation');
  const toggle = page.locator('[data-menu-toggle]');
  if (!await nav.count() || !await toggle.count()) return;

  const collapses = spec.width <= 896;
  if (collapses) {
    assert(await toggle.isVisible(), `${label}: mobile menu toggle is not visible`);
    assert(await nav.isHidden(), `${label}: mobile navigation should begin collapsed`);
    assert(await toggle.getAttribute('aria-expanded') === 'false', `${label}: initial aria-expanded is not false`);

    await toggle.click();
    assert(await nav.isVisible(), `${label}: mobile navigation did not open`);
    assert(await toggle.getAttribute('aria-expanded') === 'true', `${label}: open aria-expanded is not true`);

    await page.keyboard.press('Escape');
    assert(await nav.isHidden(), `${label}: Escape did not close mobile navigation`);
    assert(await toggle.getAttribute('aria-expanded') === 'false', `${label}: closed aria-expanded is not false`);
    const focused = await toggle.evaluate(node => node === document.activeElement);
    assert(focused, `${label}: focus did not return to menu toggle after Escape`);
  } else {
    assert(await toggle.isHidden(), `${label}: menu toggle should be hidden on desktop`);
    assert(await nav.isVisible(), `${label}: desktop navigation should remain visible`);
  }
}

const browser = await chromium.launch({ headless:true });

try {
  for (const spec of viewports) {
    await run(`Responsive matrix · ${spec.name}`, async () => {
      const context = await makeContext(browser, spec);
      try {
        for (const item of representative) {
          const page = await context.newPage();
          try {
            await open(page, item.path);
            await assertNoHorizontalOverflow(page, `${spec.name}/${item.name}`);
            await assertNavigation(page, spec, `${spec.name}/${item.name}`);
            const h1 = page.locator('h1').first();
            assert(await h1.count() === 1, `${spec.name}/${item.name}: H1 missing`);
            assert((await h1.innerText()).trim().length > 0, `${spec.name}/${item.name}: H1 is empty`);

            if ((spec.name === 'mobile-360' || spec.name === 'desktop-1440') && ['home','repair','signal','account-inspection'].includes(item.name)) {
              await page.screenshot({
                path: path.join(outDir, `${spec.name}-${item.name}.png`),
                fullPage: false,
              });
            }
          } finally {
            await page.close();
          }
        }
      } finally {
        await context.close();
      }
    });
  }

  await run('Role flow · PC Repair → Signal Scan', async () => {
    const context = await makeContext(browser, viewports[0]);
    const page = await context.newPage();
    try {
      await open(page, 'pc-repair-pretoria.html');
      const link = page.locator('a[data-signal-link]');
      assert(await link.count() === 1, 'Repair page Signal Scan handoff link missing');
      await Promise.all([
        page.waitForURL(url => url.pathname.endsWith('/signal-scan.html') && url.searchParams.get('source') === 'repair'),
        link.click(),
      ]);
      assert(await page.locator('#panel').count() === 1, 'Signal Scan panel did not load after service handoff');
      await assertNoHorizontalOverflow(page, 'repair-to-signal');
    } finally {
      await page.close();
      await context.close();
    }
  });

  await run('Role flow · Signal Scan completes', async () => {
    const context = await makeContext(browser, viewports[0]);
    const page = await context.newPage();
    try {
      await open(page, 'signal-scan.html?source=repair&issue=boot');
      for (let i = 0; i < 10; i += 1) {
        const option = page.locator('.scan-option').first();
        if (!await option.count()) break;
        await option.click();
        await page.waitForTimeout(30);
      }
      const result = page.locator('.scan-badge');
      assert(await result.isVisible(), 'Signal Scan did not reach a result');
      const whatsapp = page.locator('[data-scan-route="whatsapp"]');
      const email = page.locator('[data-scan-route="email"]');
      assert((await whatsapp.getAttribute('href') || '').startsWith('https://wa.me/'), 'Signal Scan WhatsApp handoff is invalid');
      assert((await email.getAttribute('href') || '').startsWith('mailto:'), 'Signal Scan email handoff is invalid');
      await page.screenshot({ path:path.join(outDir, 'mobile-360-signal-result.png'), fullPage:false });
    } finally {
      await page.close();
      await context.close();
    }
  });

  await run('Customer role · account inspection is read-only', async () => {
    const context = await makeContext(browser, viewports[0]);
    const page = await context.newPage();
    try {
      await open(page, 'account.html?inspect=1');
      await page.waitForSelector('#accountHub:not([hidden])');
      assert(await page.locator('#authGate').isHidden(), 'Inspection mode unexpectedly exposes auth gate');
      const copy = (await page.locator('#accountPreview').innerText()).toLowerCase();
      assert(copy.includes('read-only'), 'Inspection banner does not identify read-only mode');
      const enabledControls = await page.locator('#accountHub form input:not([disabled]),#accountHub form select:not([disabled]),#accountHub form button:not([disabled])').count();
      assert(enabledControls === 0, `Inspection mode has ${enabledControls} enabled form control(s)`);
    } finally {
      await page.close();
      await context.close();
    }
  });

  await run('Customer role · preview sign-in fails closed', async () => {
    const context = await makeContext(browser, viewports[0]);
    const page = await context.newPage();
    try {
      await open(page, 'account.html');
      await page.waitForSelector('#authGate:not([hidden])');
      assert(await page.locator('#accountHub').isHidden(), 'Customer hub is visible without a session');
      const enabled = await page.locator('#authGate input:not([disabled]),#authGate button:not([disabled])').count();
      assert(enabled === 0, `Preview auth gate has ${enabled} enabled control(s)`);
      const preview = (await page.locator('#accountPreview').innerText()).toLowerCase();
      assert(preview.includes('preview host') || preview.includes('unavailable'), 'Preview account boundary message missing');
    } finally {
      await page.close();
      await context.close();
    }
  });

  await run('Admin role · preview remains fail-closed', async () => {
    const context = await makeContext(browser, viewports[2]);
    const page = await context.newPage();
    try {
      await open(page, 'admin.html');
      await page.waitForTimeout(250);
      const robots = await page.locator('meta[name="robots"]').getAttribute('content');
      assert((robots || '').toLowerCase().includes('noindex'), 'Admin page noindex boundary missing');
      assert(await page.locator('#app').isHidden(), 'Admin application became visible without authenticated bootstrap');
      await assertNoHorizontalOverflow(page, 'admin-preview');
    } finally {
      await page.close();
      await context.close();
    }
  });
} finally {
  await browser.close();
}

const summary = {
  step:'9.2',
  title:'Responsive/device interaction and role-flow QA',
  branch:'clean-rebuild',
  base,
  total:results.length,
  passed:results.filter(r => r.status === 'PASS').length,
  failed:results.filter(r => r.status === 'FAIL').length,
  status:failures ? 'FAIL' : 'PASS',
  results,
};

fs.writeFileSync(path.join(outDir, 'step-9.2-summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
fs.writeFileSync(
  path.join(outDir, 'step-9.2-summary.md'),
  [
    '# VoltTech Step 9.2 — Device + role-flow QA',
    '',
    `Overall: **${summary.status}**`,
    `Passed: ${summary.passed}/${summary.total}`,
    `Failed: ${summary.failed}/${summary.total}`,
    '',
    '| Gate | Result | Detail |',
    '| --- | --- | --- |',
    ...results.map(r => `| ${r.name.replaceAll('|','\\|')} | ${r.status} | ${(r.detail || '').replaceAll('|','\\|')} |`),
    '',
  ].join('\n'),
  'utf8'
);

console.log(`\n=== STEP 9.2 ${summary.status} ===`);
console.log(`${summary.passed}/${summary.total} gates passed.`);
console.log(`Evidence: ${outDir}`);
process.exit(failures ? 1 : 0);

// Step 9.2 Account DOM correction rerun — 2026-09-25.

// Step 9.2 final Account avatar correction rerun — 2026-09-25.
