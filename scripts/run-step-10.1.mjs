import { spawnSync } from 'node:child_process';
import process from 'node:process';

const run=spawnSync('node',['scripts/test-release-candidate.mjs'],{
  cwd:process.cwd(),
  encoding:'utf8',
  env:process.env,
  maxBuffer:16*1024*1024
});
if(run.stdout)process.stdout.write(run.stdout);
if(run.stderr)process.stderr.write(run.stderr);
process.exit(run.status ?? 1);

// Step 10.1 RC trigger — upload this file last.
