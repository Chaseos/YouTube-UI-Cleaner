import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configuration = process.argv.includes('--release') ? 'Release' : 'Debug';
const signed = process.argv.includes('--signed');
function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`${command} failed (${result.status})`);
}
run(process.execPath, ['scripts/prepare-apple.mjs']);
run('xcodebuild', ['-project', 'apple/YouTube UI Cleaner/YouTube UI Cleaner.xcodeproj',
  '-jobs', '1',
  '-scheme', 'YouTube UI Cleaner', '-configuration', configuration, '-destination', 'generic/platform=macOS',
  '-derivedDataPath', `build/apple-${configuration.toLowerCase()}-${signed ? 'signed' : 'unsigned'}`,
  ...(signed ? ['CODE_SIGN_IDENTITY=Apple Development'] : ['CODE_SIGNING_ALLOWED=NO']), 'build']);
console.log(`Built ${configuration}, ${signed ? 'development signed' : 'unsigned'}, Intel + Apple Silicon. No archive or upload performed.`);
