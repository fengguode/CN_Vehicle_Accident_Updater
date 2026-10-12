import { withWindowsIngestionLock } from './vnext-ingestion-lock.mjs';

const commands = new Map([
  ['public', '../apps/updater/run-public.js'],
  ['social', '../apps/social-collector/import-inbox.js']
]);
const command = commands.get(process.argv[2]);
if (!command) {
  console.error('Usage: node scripts/vnext-locked-command.mjs <public|social>');
  process.exitCode = 2;
} else {
  try {
    await withWindowsIngestionLock(() => import(command));
  } catch (error) {
    console.error(error.message);
    process.exitCode = error.exitCode || 1;
  }
}
