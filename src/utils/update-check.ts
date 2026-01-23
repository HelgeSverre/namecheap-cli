import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import updateNotifier from 'update-notifier';

function getPackageInfo(): { name: string; version: string } {
  try {
    const pkgPath = join(process.cwd(), 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    return { name: pkg.name, version: pkg.version };
  } catch {
    return { name: 'namecheap-cli', version: '0.1.0' };
  }
}

export function checkForUpdates(): void {
  const pkg = getPackageInfo();

  const notifier = updateNotifier({
    pkg,
    updateCheckInterval: 1000 * 60 * 60 * 24, // 1 day
  });

  notifier.notify({
    isGlobal: true,
    message: 'Update available: {currentVersion} → {latestVersion}\nRun `npm i -g namecheap-cli` to update',
  });
}
