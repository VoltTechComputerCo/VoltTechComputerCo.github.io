import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const outDir = path.join(root, 'qa-results/step-10.3');
fs.mkdirSync(outDir, { recursive: true });
const statePath = path.join(outDir, 'promotion-state.json');

// Production main verified immediately before this release package was generated.
const EXPECTED_MAIN_HEAD = '807eec3de6aa23434200bc933111678cf3fbbf33';

function git(args, { allowFail = false } = {}) {
  const run = spawnSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024
  });
  if (!allowFail && run.status !== 0) {
    throw new Error(
      `git ${args.join(' ')} failed\n${run.stdout || ''}\n${run.stderr || ''}`.trim()
    );
  }
  return run;
}

const stdout = args => git(args).stdout.trim();
const load = () =>
  fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : {};
const save = state =>
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n', 'utf8');

function fail(message, state = load()) {
  save({ ...state, status: 'FAIL', error: message });
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function verifyMainHead(expected, state) {
  const current = stdout(['rev-parse', 'origin/main']);
  if (current !== expected) {
    fail(`main moved: expected ${expected}, found ${current}`, state);
  }
  return current;
}

function assertMergeParents(mainHead, cleanHead, state) {
  const parents = stdout(['show', '-s', '--format=%P', 'HEAD'])
    .split(/\s+/)
    .filter(Boolean);

  if (parents.length !== 2) {
    fail(`promotion commit is not a 2-parent merge commit: ${parents.join(' ')}`, state);
  }
  if (parents[0] !== mainHead || parents[1] !== cleanHead) {
    fail(
      `promotion parents mismatch: expected "${mainHead} ${cleanHead}", found "${parents.join(' ')}"`,
      state
    );
  }
  return parents;
}

async function prepare() {
  const cleanHead = stdout(['rev-parse', 'HEAD']);
  const mainHead = verifyMainHead(EXPECTED_MAIN_HEAD, {});
  const mergeBase = stdout(['merge-base', cleanHead, 'origin/main']);

  const state = {
    step: '10.3-refresh',
    title: 'Controlled clean-rebuild promotion to production main',
    phase: 'prepare',
    clean_head: cleanHead,
    expected_main_head: EXPECTED_MAIN_HEAD,
    main_head: mainHead,
    merge_base: mergeBase,
    production_tree_policy: 'exact-clean-rebuild',
    pushed_to_main: false
  };

  git(['config', 'user.name', 'github-actions[bot]']);
  git(['config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com']);

  // Start from the exact production head that was verified when the release
  // package was built.
  git(['checkout', '-B', 'release-main-promotion', 'origin/main']);

  // Establish a real merge relationship so production history retains both
  // current main and clean-rebuild. Conflicts are expected because both
  // branches have moved since their common base.
  const merge = git(['merge', '--no-ff', '--no-commit', cleanHead], { allowFail: true });

  if (!fs.existsSync(path.join(root, '.git', 'MERGE_HEAD'))) {
    fail(
      `merge did not enter a merge state: ${(merge.stderr || merge.stdout || 'unknown merge failure').trim()}`,
      state
    );
  }

  const conflicts = stdout(['diff', '--name-only', '--diff-filter=U'])
    .split('\n')
    .filter(Boolean)
    .sort();
  state.detected_conflicts = conflicts;

  // clean-rebuild is the certified release candidate. Normalize the *entire*
  // merge result to its exact tree, including deletions. This avoids silently
  // carrying stale production-only files forward while still producing a
  // normal fast-forwardable merge commit with current main as parent #1.
  git(['read-tree', '--reset', '-u', cleanHead]);

  const unresolved = stdout(['diff', '--name-only', '--diff-filter=U'])
    .split('\n')
    .filter(Boolean);
  if (unresolved.length) {
    fail(`unresolved conflicts remain after clean-tree normalization: ${unresolved.join(', ')}`, state);
  }

  git(['commit', '-m', 'release: promote finished clean rebuild to production']);

  const promotionHead = stdout(['rev-parse', 'HEAD']);
  const cleanTree = stdout(['rev-parse', `${cleanHead}^{tree}`]);
  const promotionTree = stdout(['rev-parse', 'HEAD^{tree}']);

  state.promotion_head = promotionHead;
  state.clean_tree = cleanTree;
  state.promotion_tree = promotionTree;
  state.tree_identical_to_clean = cleanTree === promotionTree;
  state.parents = assertMergeParents(mainHead, cleanHead, state);

  if (!state.tree_identical_to_clean) {
    const diff = stdout(['diff', '--name-status', cleanHead, 'HEAD']);
    fail(`promotion tree differs from clean-rebuild:\n${diff}`, state);
  }

  state.status = 'PREPARED';
  save(state);

  console.log(`PASS: promotion merge prepared from main ${mainHead}`);
  console.log(`PASS: clean source ${cleanHead}`);
  console.log(`PASS: production candidate tree is byte-identical to clean-rebuild`);
  console.log(`INFO: ${conflicts.length} merge conflict path(s) normalized to certified clean tree`);
}

async function certify() {
  const state = load();
  if (state.status !== 'PREPARED' || !state.promotion_head) {
    fail('promotion state is not PREPARED', state);
  }

  const fullPath = path.join(root, 'qa-results/step-9.1-summary.json');
  const step9Path = path.join(root, 'qa-results/step-9.3/step-9.3-summary.json');

  if (!fs.existsSync(fullPath) || !fs.existsSync(step9Path)) {
    fail('QA summaries are missing', state);
  }

  const full = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  const step9 = JSON.parse(fs.readFileSync(step9Path, 'utf8'));

  const currentCleanTree = stdout(['rev-parse', `${state.clean_head}^{tree}`]);
  const currentPromotionTree = stdout(['rev-parse', 'HEAD^{tree}']);

  const checks = {
    tree_identical_to_clean:
      state.tree_identical_to_clean === true &&
      currentCleanTree === currentPromotionTree,
    full_regression:
      full.status === 'PASS' && full.passed === 24 && full.total === 24,
    step_9_3: step9.status === 'PASS',
    device_role: step9.gates?.device_role === '9/9',
    release_source: step9.gates?.release_source === '15/15',
    release_browser: step9.gates?.release_browser === '11/11',
    commerce_disabled: step9.commerce_launch_ready === false
  };

  const bad = Object.entries(checks)
    .filter(([, ok]) => !ok)
    .map(([name]) => name);

  if (bad.length) {
    fail(`pre-push certification failed: ${bad.join(', ')}`, { ...state, checks });
  }

  state.phase = 'certified';
  state.checks = checks;
  state.full_regression = '24/24';
  state.step_9_gates = step9.gates;
  state.commerce_launch_ready = false;
  state.status = 'CERTIFIED';
  save(state);

  console.log('PASS: final pre-push certification is green');
}

async function prepush() {
  const state = load();
  if (state.status !== 'CERTIFIED') {
    fail('promotion is not certified', state);
  }

  // Reconfirm production did not change while QA was running.
  const current = verifyMainHead(state.expected_main_head, state);

  const head = stdout(['rev-parse', 'HEAD']);
  if (head !== state.promotion_head) {
    fail(`promotion HEAD changed after certification: ${head}`, state);
  }

  const headTree = stdout(['rev-parse', 'HEAD^{tree}']);
  if (headTree !== state.clean_tree) {
    fail('promotion tree changed after certification', state);
  }

  assertMergeParents(state.main_head, state.clean_head, state);

  state.phase = 'prepush';
  state.prepush_main_head = current;
  state.status = 'READY_TO_PUSH';
  save(state);

  console.log('PASS: main is unchanged and certified promotion is ready to push');
}

async function recordPush() {
  const state = load();
  if (state.status !== 'READY_TO_PUSH') {
    fail('push occurred without READY_TO_PUSH state', state);
  }

  state.phase = 'pushed';
  state.pushed_to_main = true;
  state.pushed_head = stdout(['rev-parse', 'HEAD']);
  state.status = 'PUSHED';
  save(state);

  console.log(`PUSHED: ${state.pushed_head} -> main`);
}

async function verifyRemote() {
  const state = load();
  if (state.status !== 'PUSHED') {
    fail('remote verification requested before push', state);
  }

  const remoteMain = stdout(['rev-parse', 'origin/main']);
  if (remoteMain !== state.pushed_head) {
    fail(`remote main mismatch: expected ${state.pushed_head}, found ${remoteMain}`, state);
  }

  const remoteTree = stdout(['rev-parse', 'origin/main^{tree}']);
  if (remoteTree !== state.clean_tree) {
    fail('remote main tree does not match certified clean-rebuild tree', state);
  }

  const summary = {
    step: '10.3-refresh',
    title: 'Production promotion of finished clean rebuild',
    status: 'PASS',
    previous_main_head: state.expected_main_head,
    promoted_main_head: remoteMain,
    clean_head: state.clean_head,
    tree_identical_to_clean: true,
    full_regression: state.full_regression,
    step_9_gates: state.step_9_gates,
    commerce_launch_ready: false,
    pushed_to_main: true
  };

  fs.writeFileSync(
    path.join(outDir, 'step-10.3-summary.json'),
    JSON.stringify(summary, null, 2) + '\n',
    'utf8'
  );

  state.phase = 'verified';
  state.remote_main_head = remoteMain;
  state.status = 'PASS';
  save(state);

  console.log('=== VOLTTECH CLEAN REBUILD PRODUCTION PROMOTION PASS ===');
  console.log(`Remote main is now ${remoteMain}`);
  console.log('PASS: remote main tree exactly matches clean-rebuild');
}

const mode = process.argv[2];

if (mode === 'prepare') await prepare();
else if (mode === 'certify') await certify();
else if (mode === 'prepush') await prepush();
else if (mode === 'record-push') await recordPush();
else if (mode === 'verify-remote') await verifyRemote();
else {
  console.error(
    'Usage: node scripts/run-step-10.3.mjs <prepare|certify|prepush|record-push|verify-remote>'
  );
  process.exit(2);
}

// 2026-09-26 production promotion trigger.
// Upload this file LAST to clean-rebuild at scripts/run-step-10.3.mjs.
