# 05 — Testing Results & Issues Encountered

## Verification run

**Date:** 2026-11-24  
**Scope:** Repository lint, server automated test command, and production builds for both frontends.  
**Environment:** Local Windows workspace. No database-backed or browser-based manual workflow was run.

| Check                     | Result | Evidence                                                                                                                                                                                                                                              |
| ------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run lint`            | Passed | ESLint exited with code 0 and no warnings or errors.                                                                                                                                                                                                  |
| `npm test`                | Passed | Vitest ran `server/tests/api.test.js`: 7 tests passed. They cover the health envelope, login validation and credentials, staff login role rejection, successful customer login response, user-management authorization, and admin listing pagination. |
| Customer production build | Passed | Elevated-access retry transformed 1,590 modules and completed successfully.                                                                                                                                                                           |
| Admin production build    | Passed | Elevated-access retry transformed 1,608 modules and completed successfully.                                                                                                                                                                           |

## Coverage status

The new suite covers selected foundation endpoints with a mocked Prisma client; it does not connect to PostgreSQL. Remaining automated coverage includes registration persistence and duplicate email, valid staff login and deactivated accounts, rate limits, password reset expiry and single use, admin create/update, and checkout, customer ownership, inventory, fulfillment, payment, and finance workflows. The requirement IDs and intended cases are tracked in [the traceability matrix](traceability.md); mappings alone are not evidence that tests have run.

Manual workflow verification and screenshot capture are also pending. Use [the demo script](demo-script.md) to rehearse Workflow 1 (online order through payment) and Workflow 2 (restock through catalog and finance visibility), and record the actual outcome and any deviations here after running against a configured database.

## Issues encountered

| ID     | Issue description                                                                          | Root cause / evidence                                                                                                                                         | Resolution or next action                                                                                 | Status   |
| ------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------- |
| VFY-01 | Automated API coverage is partial.                                                         | Seven foundation API tests pass with a mocked Prisma client; broader business workflows and database transactions are not covered.                            | Add the remaining approved cases and database-backed checks before treating the system as fully verified. | Open     |
| VFY-02 | Initial frontend builds could not access a parent directory during esbuild config loading. | Both initial builds reported `Cannot read directory "../../../../..": Access is denied`. With elevated access, both production builds completed successfully. | Retry confirmed this was a sandbox access limitation.                                                     | Resolved |
| VFY-03 | End-to-end demo and screenshots have no execution evidence yet.                            | Screenshot folder contains instructions only; no manual run was performed in this verification pass.                                                          | Rehearse both documented workflows and capture screenshots after database setup.                          | Open     |

## Verification notes

- A passing lint check confirms static lint rules only; it does not establish runtime correctness.
- No production database, seeded demo data, customer browser session, or ERP staff session was exercised during this run.
