# VoltTech clean rebuild

Branch: `clean-rebuild`

Current phase: **Step 9.2 Correction — Account DOM/source alignment**.

The first Step 9.2 browser run passed all responsive matrices, the Repair → Signal Scan journey, Signal Scan completion and the Admin fail-closed boundary. It exposed one real Account regression: the generated Account page and its source template had drifted back to an older DOM that no longer matched the current Account controller.

## Upload
Upload everything inside `Step 9.2 Correction/` to matching repository paths.

Delete nothing.

No folder placeholders are required; every destination folder already exists.

### Upload order
Upload the Account/source/test/documentation files first.

Upload `scripts/run-full-qa.mjs` **SECOND LAST**. This reruns the 24-gate full regression suite.

Upload `scripts/test-device-role-qa.mjs` **LAST**. This reruns the Step 9.2 Chromium device/role suite.

Expected workflows:
- `VoltTech Full QA`
- `VoltTech Device + Role QA`

Expected target results:
- Full QA: **24/24 PASS**
- Device + Role QA: **9/9 PASS**

No Supabase data/schema, authentication service logic, Store/Builder launch state, payments or other customer-facing pages are altered by this correction.

After both automated runs pass, manually inspect the nominated Step 9.2 GitHack pages before Step 9.3 begins.
