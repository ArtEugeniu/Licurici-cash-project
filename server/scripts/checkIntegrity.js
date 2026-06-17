import { initDB, db } from '../db/index.js';
import { runIntegrityCheck } from '../services/integrityService.js';

await initDB();

const fromArg = process.argv.find((arg) => arg.startsWith('--from='));
const fromDate = fromArg ? fromArg.split('=')[1] : '2025-10-01';

const result = await runIntegrityCheck(db, { fromDate });

console.log(JSON.stringify(result, null, 2));

if (!result.ok) {
  process.exitCode = 1;
}
