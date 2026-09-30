#!/usr/bin/env python3
"""VoltTech clean-rebuild site-wide repository cleanup.

This is intentionally conservative:
- removes historical one-shot migration/release tooling and generated QA evidence;
- removes proven-dead root runtime files superseded by the source-generated clean frontend;
- keeps current admin/auth runtime, Supabase contracts, STATIC publishing, Builder/commerce,
  source files, product/service imagery and asset provenance;
- narrows the service-worker legacy injection boundary to admin pages only.

The GitHub workflow creates a rollback branch before this script runs and commits only after
the retained full QA suite passes.
"""
from __future__ import annotations

import os
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXPECTED_BRANCH = "clean-rebuild"

branch = os.environ.get("GITHUB_REF_NAME")
if branch and branch != EXPECTED_BRANCH:
    raise SystemExit(f"Refusing cleanup on {branch!r}; expected {EXPECTED_BRANCH!r}")

deleted: list[tuple[str, int]] = []
updated: list[str] = []


def remove_file(rel: str) -> None:
    path = ROOT / rel
    if not path.exists():
        return
    if path.is_dir():
        size = sum(p.stat().st_size for p in path.rglob("*") if p.is_file())
        shutil.rmtree(path)
    else:
        size = path.stat().st_size
        path.unlink()
    deleted.append((rel, size))


def write_text(rel: str, content: str) -> None:
    path = ROOT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    content = content.rstrip() + "\n"
    old = path.read_text(encoding="utf-8") if path.exists() else None
    if old != content:
        path.write_text(content, encoding="utf-8")
        updated.append(rel)


def replace_required(rel: str, old: str, new: str) -> None:
    path = ROOT / rel
    text = path.read_text(encoding="utf-8")
    if old not in text:
        raise RuntimeError(f"Expected cleanup patch marker not found in {rel}")
    text2 = text.replace(old, new, 1)
    if text2 != text:
        path.write_text(text2, encoding="utf-8")
        updated.append(rel)


# ---------------------------------------------------------------------------
# 1) High-confidence obsolete root runtime: superseded by assets/js + assets/css
#    and verified absent from generated pages, STATIC, Exposure Scan and admin HTML.
# ---------------------------------------------------------------------------
dead_root = [
    "account-dashboard.js",
    "account-filters.js",
    "account-phase4.css",
    "account-v3.css",
    "account-v4-nav.js",
    "account.js",
    "activity.js",
    "admin-shortcut.js",
    "analytics.js",
    "builds.js",
    "contact-icons-static.css",
    "contact-icons.css",
    "diagnostic-console.css",
    "diagnostic-console.js",
    "documents.js",
    "mobile-nav.css",
    "phase9-business-finish.css",
    "phase9-business-finish.js",
    "portal-phase4.css",
    "quotes.js",
    "scan-handoff.js",
    "symptom-handoff.js",
    "visual-block-fix.css",
    "visual-system.css",
    "volttech-experience.css",
    "volttech-experience.js",
]
for rel in dead_root:
    remove_file(rel)

# Repository-only artifacts that do not belong in deployed site payload.
for rel in [
    "brand/VoltTech_Official_Logo_Pack.zip",
    "PACKAGE_MANIFEST.json",
    "V2_START_HERE.md",
]:
    remove_file(rel)

# Generated QA output must be an Actions artifact, not tracked repository content.
remove_file("qa-results")

# Compiled Python cache never belongs in source.
remove_file("scripts/__pycache__")


# ---------------------------------------------------------------------------
# 1B) Modernise retained QA that previously depended on historical delivery manifests.
# ---------------------------------------------------------------------------
customer_records_test = ROOT / "scripts" / "test-clean-customer-records.mjs"
customer_records_text = customer_records_test.read_text(encoding="utf-8")
old_customer_records_tail = """const manifest=JSON.parse(read('docs/clean-rebuild/step-5.2-manifest.json'));
for(const d of ['scripts/__pycache__/check-clean-frontend.cpython-313.pyc','scripts/__pycache__/Placeholder.txt'])if(!manifest.delete.includes(d))throw new Error(`cleanup deletion missing: ${d}`);
const corrected=JSON.parse(read('docs/clean-rebuild/step-5.1-manifest.json'));
if(Object.keys(corrected.sha256).some(p=>p.includes('__pycache__')))throw new Error('corrected 5.1 manifest still contains pycache');
console.log('PASS: clean customer records pages, auth boundary, quote contract and Step 5.1 cache cleanup');"""
new_customer_records_tail = """if(fs.existsSync(path.join(root,'scripts/__pycache__')))throw new Error('Python cache directory returned after repository cleanup');
const ignore=read('.gitignore');
if(!ignore.includes('__pycache__/')||!ignore.includes('*.py[cod]'))throw new Error('Python cache ignore contract missing');
console.log('PASS: clean customer records pages, auth boundary, quote contract and repository cache cleanup');"""

if old_customer_records_tail not in customer_records_text:
    raise RuntimeError("Expected historical Customer Records manifest assertions not found")
customer_records_test.write_text(
    customer_records_text.replace(old_customer_records_tail, new_customer_records_tail, 1),
    encoding="utf-8",
)
updated.append("scripts/test-clean-customer-records.mjs")


# ---------------------------------------------------------------------------
# 2) Historical clean-rebuild delivery evidence.
#    Keep the image provenance record because it documents source/licensing context.
# ---------------------------------------------------------------------------
docs = ROOT / "docs" / "clean-rebuild"
if docs.exists():
    for path in sorted(docs.glob("step-*")):
        rel = path.relative_to(ROOT).as_posix()
        if rel == "docs/clean-rebuild/step-1.2-assets.md":
            continue
        remove_file(rel)


# ---------------------------------------------------------------------------
# 3) Retire completed one-shot workflows.
#    Current source sync, QA and STATIC automation are deliberately retained.
# ---------------------------------------------------------------------------
historical_workflows = [
    ".github/workflows/live-verification.yml",
    ".github/workflows/promote-main.yml",
    ".github/workflows/promotion-rehearsal.yml",
    ".github/workflows/release-candidate.yml",
    ".github/workflows/release-certification.yml",
    ".github/workflows/seo-url-normalization.yml",
    ".github/workflows/static-history-migration.yml",
    ".github/workflows/step-10.4-final-404.yml",
    ".github/workflows/step-10.4-production-fix.yml",
    ".github/workflows/step-11.1d-production-promotion.yml",
    ".github/workflows/step-11.2b-positioning.yml",
    ".github/workflows/step-11.2c-service-images.yml",
    ".github/workflows/step-11.2d-service-heroes.yml",
    ".github/workflows/step-11.2e-homepage-hero-refresh.yml",
    ".github/workflows/step-11.2f-hero-cta-glass-buttons.yml",
    ".github/workflows/step-11.2g-image-overlay-glass.yml",
    ".github/workflows/step-11.2h-sitewide-glass.yml",
    ".github/workflows/step-11.2i-atmosphere-nav-creator.yml",
    ".github/workflows/step-11.2j-photo-canvas-image-nav.yml",
    ".github/workflows/step-11.2k-performance-recovery.yml",
    ".github/workflows/step-11.2l-procedural-tech-background.yml",
    ".github/workflows/step-11.2m-image-menu-circuit-bg.yml",
    ".github/workflows/step-11.2n-custom-menu-images.yml",
    ".github/workflows/step-11.2p-unified-tool-nav.yml",
    ".github/workflows/step-11.2q-creator-registration-discovery.yml",
    ".github/workflows/step-11.2r-creator-feed-status-fix.yml",
]
for rel in historical_workflows:
    remove_file(rel)


# ---------------------------------------------------------------------------
# 4) Retire the matching completed migration/release scripts and tests.
# ---------------------------------------------------------------------------
scripts_dir = ROOT / "scripts"
if scripts_dir.exists():
    historical_names = {
        "fix-step-11.2q-clean-boundary.py",
        "migrate-static-history.py",
        "normalize-public-urls.py",
        "test-release-browser.mjs",
        "test-release-candidate.mjs",
        "test-release-source.mjs",
        "test-static-history-migration.py",
    }

    for path in sorted(scripts_dir.iterdir()):
        if not path.is_file():
            continue
        name = path.name
        historical = (
            name in historical_names
            or name.startswith("apply-step-11.2")
            or name.startswith("test-step-11.2")
            or name.startswith("run-step-")
        )
        if historical:
            remove_file(path.relative_to(ROOT).as_posix())


# ---------------------------------------------------------------------------
# 5) Runtime performance fix:
#    Clean generated pages were already isolated, but every other HTML navigation
#    used to receive the legacy notification/launch loader. Restrict that path to
#    legacy admin pages only so STATIC articles / Exposure Scan avoid an extra
#    loader + possible Supabase launch-settings request.
# ---------------------------------------------------------------------------
new_sw = r"""const VT_NOTIFICATION_LOADER='site-notifications-loader.js?v=6.0.0';
const VT_VERSION_REWRITES=[
 ['notifications.css?v=5.0.0','notifications.css?v=5.2.0'],
 ['notifications.css?v=5.1.0','notifications.css?v=5.2.0'],
 ['notifications.js?v=5.0.0','notifications.js?v=5.2.0'],
 ['notifications.js?v=5.1.0','notifications.js?v=5.2.0'],
 ['portal-shell.css?v=5.0.0','portal-shell.css?v=5.2.0'],
 ['portal-shell.css?v=5.1.0','portal-shell.css?v=5.2.0'],
 ['portal-shell.js?v=5.0.0','portal-shell.js?v=5.2.0'],
 ['portal-shell.js?v=5.1.0','portal-shell.js?v=5.2.0'],
 ['site-notifications-loader.js?v=5.0.0','site-notifications-loader.js?v=6.0.0'],
 ['site-notifications-loader.js?v=5.1.0','site-notifications-loader.js?v=6.0.0'],
 ['site-notifications-loader.js?v=5.2.0','site-notifications-loader.js?v=6.0.0'],
 ['site-notifications-loader.js?v=5.3.0','site-notifications-loader.js?v=6.0.0'],
 ['site-notifications-loader.js?v=5.4.0','site-notifications-loader.js?v=6.0.0']
];

self.addEventListener('install',event=>{self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(self.clients.claim());});

self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.mode!=='navigate'){
   event.respondWith(fetch(request));
   return;
 }

 const url=new URL(request.url);
 if(url.origin!==self.location.origin){
   event.respondWith(fetch(request));
   return;
 }

 event.respondWith((async()=>{
  const response=await fetch(request);
  const type=response.headers.get('content-type')||'';
  if(!response.ok||!type.includes('text/html'))return response;

  // Source-generated clean pages own their complete runtime and are never rewritten.
  let html=await response.clone().text();
  if(/<html\b[^>]*\bdata-vt-shell\s*=\s*["']clean["']/i.test(html))return response;

  // Only legacy admin pages still require the compatibility notification/bootstrap layer.
  // Public STATIC articles, Exposure Scan and compatibility redirects stay byte-for-byte.
  const pageName=(url.pathname.split('/').pop()||'').toLowerCase();
  if(!/^admin(?:-[a-z0-9-]+)?(?:\.html)?$/i.test(pageName))return response;

  for(const [from,to] of VT_VERSION_REWRITES){
    if(html.includes(from))html=html.split(from).join(to);
  }

  if(!html.includes('site-notifications-loader.js')){
    const loaderUrl=new URL(VT_NOTIFICATION_LOADER,self.registration.scope).href;
    const tag=`<script src="${loaderUrl}"></script>`;
    html=html.includes('</body>')
      ? html.replace('</body>',`${tag}\n</body>`)
      : `${html}\n${tag}`;
  }

  const headers=new Headers(response.headers);
  headers.delete('content-length');
  headers.delete('content-encoding');
  headers.delete('etag');

  return new Response(html,{
    status:response.status,
    statusText:response.statusText,
    headers
  });
 })().catch(()=>fetch(request)));
});
"""
write_text("sw.js", new_sw)


# Update the service-worker contract test to match the narrower admin-only boundary.
runtime_test = ROOT / "scripts" / "test-clean-runtime.mjs"
runtime_text = runtime_test.read_text(encoding="utf-8")
start = runtime_text.index("const clean = ")
end_marker = "console.log('PASS: service worker isolates clean HTML; legacy, error and non-HTML paths preserved');"
end = runtime_text.index(end_marker) + len(end_marker)
replacement = r"""const clean = '<html lang="en-ZA" data-vt-shell="clean"><body>notifications.css?v=5.0.0</body></html>';
let response = await navigate(clean);
assert.equal(await response.text(), clean, 'Clean page is byte-for-byte unchanged');
assert.equal(response.headers.get('etag'), 'original');

const publicLegacy = '<html><body>notifications.css?v=5.0.0</body></html>';
response = await navigate(publicLegacy, { url: 'https://example.test/static-test.html' });
assert.equal(await response.text(), publicLegacy, 'Public non-admin HTML must not receive the legacy loader');
assert.equal(response.headers.get('etag'), 'original');

response = await navigate('<html><body>notifications.css?v=5.0.0</body></html>', { url: 'https://example.test/admin.html' });
const legacy = await response.text();
assert.ok(legacy.includes('notifications.css?v=5.2.0'), 'Admin legacy version update preserved');
assert.ok(legacy.includes('https://example.test/site-notifications-loader.js?v=6.0.0'), 'Admin legacy notifications preserved');
assert.equal(response.headers.get('etag'), null);

response = await navigate('<html><body><script src="site-notifications-loader.js?v=6.0.0"></script></body></html>', { url: 'https://example.test/admin-store.html' });
assert.equal((await response.text()).match(/site-notifications-loader/g).length, 1, 'No duplicate admin loader');

status = 404;
assert.equal(await (await navigate('<html>Missing</html>')).text(), '<html>Missing</html>');
status = 200;
contentType = 'application/json';
assert.equal(await (await navigate('{"ok":true}')).text(), '{"ok":true}');
contentType = 'text/html';
assert.equal(await (await navigate(clean, { mode: 'cors' })).text(), clean);
assert.equal(await (await navigate(clean, { url: 'https://other.test/page.html' })).text(), clean);
console.log('PASS: service worker leaves clean/public HTML untouched and limits legacy injection to admin pages');"""
runtime_test.write_text(runtime_text[:start] + replacement + runtime_text[end:] , encoding="utf-8")
updated.append("scripts/test-clean-runtime.mjs")


# The clean frontend syntax gate no longer checks files removed above.
replace_required(
    "scripts/check-clean-frontend.py",
    "for name in ('notifications.js', 'streamer-feed.js', 'analytics.js', 'volttech-experience.js'):",
    "for name in ('notifications.js', 'streamer-feed.js'):",
)


# Retire the now-completed STATIC migration-only gate and stale Step 9 labels.
run_qa = ROOT / "scripts" / "run-full-qa.mjs"
qa_text = run_qa.read_text(encoding="utf-8")
qa_text = qa_text.replace(
    "  ['STATIC history migration gate', 'python3', ['scripts/test-static-history-migration.py']],\n",
    "",
)
qa_text = qa_text.replace(
    "console.log(`VoltTech Step 9.1 full QA — ${tasks.length} gates`);",
    "console.log(`VoltTech full QA — ${tasks.length} gates`);",
)
qa_text = qa_text.replace("  step: '9.1',", "  step: 'repository',")
qa_text = qa_text.replace("  title: 'Automated Full Regression QA',", "  title: 'Automated full regression QA',")
qa_text = qa_text.replace("console.log(`\\n=== STEP 9.1 ${summary.status} ===`);", "console.log(`\\n=== FULL QA ${summary.status} ===`);")
qa_text = qa_text.replace("  '# VoltTech Step 9.1 — Full QA summary',", "  '# VoltTech — Full QA summary',")
qa_text = re.sub(
    r"\n// Step 9\.2 Account DOM correction regression rerun — 2026-09-25\.\n\n// Step 9\.2 intrinsic Account avatar correction rerun — 2026-09-25\.\n?",
    "\n",
    qa_text,
)
qa_text = qa_text.rstrip() + "\n"
run_qa.write_text(qa_text, encoding="utf-8")
updated.append("scripts/run-full-qa.mjs")


# ---------------------------------------------------------------------------
# 6) Prevent generated evidence/caches from returning.
# ---------------------------------------------------------------------------
gitignore = """# Generated local / CI evidence
qa-results/
*.log

# Python cache
__pycache__/
*.py[cod]
"""
write_text(".gitignore", gitignore)


# ---------------------------------------------------------------------------
# 7) Replace stale handover docs with concise current-source guidance.
# ---------------------------------------------------------------------------
readme = """# VoltTech Computer Co. website

Production: https://volttechcomputerco.co.za
Production branch: `main`
Development / integration branch: `clean-rebuild`

## Source of truth

The clean frontend is source-generated.

- Shared HTML shell: `src/templates/`
- Page content/config: `src/pages/`
- Shared presentation: `assets/css/`
- Shared/browser controllers: `assets/js/`
- Generator: `scripts/build-clean-frontend.py`

When changing a generated page, change its source and regenerate the output. Do not create a second hand-authored implementation of the same route.

The retained root-level admin pages are still a deliberate legacy boundary. Their root admin/auth CSS and JavaScript must remain until that admin family is migrated as one controlled change.

STATIC publishing is documented in `docs/clean-rebuild/STATIC-PUBLISHING.md`. Historical STATIC articles keep their dedicated `assets/css/static-legacy/` styles; new articles use the clean STATIC article system.

## Required checks

```bash
python3 scripts/build-clean-frontend.py --check
node scripts/run-full-qa.mjs
```

The full QA runner writes evidence under `qa-results/`; that directory is intentionally ignored by Git.

## Active GitHub workflows

Only current recurring/source-of-truth workflows are retained:

- `clean-frontend-sync.yml`
- `device-role-qa.yml`
- `full-qa.yml`
- `static-discord-publisher.yml`
- `static-feed-autopilot.yml`
- `static-publishing-guard.yml`
- `static-sitemap-autopilot.yml`

## Repository cleanup — 30 September 2026

A site-wide audit removed completed migration/release runners, old QA screenshots/manifests, compiled cache, an unused 5 MB logo ZIP and root runtime files superseded by the clean frontend.

The service worker now leaves clean pages and public non-admin legacy pages untouched. Its compatibility injection remains only for legacy admin routes.

Asset provenance is deliberately retained at `docs/clean-rebuild/step-1.2-assets.md`.
"""
write_text("README.md", readme)

architecture = """# Clean rebuild architecture

Authoritative development branch: `clean-rebuild`.

## Frontend ownership

The public/customer clean frontend is generated from `src/templates/` and `src/pages/` by `scripts/build-clean-frontend.py`. Generated HTML carries `data-vt-shell="clean"` and must stay consistent with its source.

Shared CSS lives under `assets/css/`; shared modules and page controllers live under `assets/js/`. Converted routes load the shared foundation plus only their page-specific modules. This separation is intentional and should not be flattened merely to reduce file count.

## Runtime boundaries

- Clean generated pages: complete source-owned shell and runtime.
- Admin family: retained root-level legacy admin/auth implementation until migrated atomically.
- STATIC hub: clean `static.html` implementation.
- Historical STATIC articles: `static-*.html` plus `assets/css/static-legacy/`.
- Exposure Scan: standalone public tool using its dedicated root CSS.
- Compatibility routes: retained only where they redirect or preserve an existing public contract.

The service worker does not modify clean pages or public non-admin legacy pages. Compatibility loader injection is restricted to legacy admin HTML.

## Backend contracts

Supabase remains authoritative for account/admin/customer operations and gated commerce data. Store, Builder, checkout/payment and launch-state behavior must continue to fail closed where configured. Backend/RLS changes are outside a cosmetic or repository cleanup and must be reviewed separately.

## Publishing / automation

Current persistent automation covers generated frontend sync, regression QA and STATIC publishing. Completed one-shot release/migration workflows are intentionally not retained.

See:

- `RELEASE-BLOCKERS.md`
- `STATIC-PUBLISHING.md`
- `step-1.2-assets.md` for media provenance
"""
write_text("docs/clean-rebuild/ARCHITECTURE.md", architecture)

roadmap = """# Current development baseline

Repository audit baseline: 30 September 2026.

`clean-rebuild` is the authoritative integration branch for ongoing site work. Production remains on `main` and is not changed by repository-cleanup work unless a separate production promotion is explicitly performed.

## Current priorities

1. Keep the source-generated frontend and committed outputs in sync.
2. Preserve working Supabase, customer, admin, commerce and STATIC contracts.
3. Use `node scripts/run-full-qa.mjs` as the regression gate before promotion.
4. Treat commerce launch blockers in `RELEASE-BLOCKERS.md` as release requirements, not frontend styling tasks.
5. Migrate the retained legacy admin family only as an atomic, tested workstream.

Completed historical step-by-step migration packages were removed from the active branch during the repository audit. Git history and the pre-audit rollback branch remain the recovery record.
"""
write_text("docs/clean-rebuild/ROADMAP.md", roadmap)


# ---------------------------------------------------------------------------
# 8) Remove empty directories left by cleanup. Never touch .git.
# ---------------------------------------------------------------------------
for path in sorted(ROOT.rglob("*"), key=lambda p: len(p.parts), reverse=True):
    if not path.is_dir() or ".git" in path.parts:
        continue
    try:
        path.rmdir()
    except OSError:
        pass


# ---------------------------------------------------------------------------
# 9) Self-remove the temporary audit trigger so the finished branch stays clean.
# ---------------------------------------------------------------------------
for rel in [
    ".github/workflows/repository-audit-cleanup.yml",
    "scripts/repository-audit-cleanup.py",
]:
    remove_file(rel)


removed_bytes = sum(size for _, size in deleted)
print(f"Removed {len(deleted)} files/directories entries, {removed_bytes:,} bytes before regenerated QA evidence.")
print(f"Updated {len(set(updated))} retained files.")
print("Asset provenance retained: docs/clean-rebuild/step-1.2-assets.md")
print("Runtime change: public non-admin pages no longer receive the legacy service-worker loader.")
