import updateNotifier from 'update-notifier';
import { PACKAGE_NAME, PACKAGE_VERSION } from '../lib/package-info.js';

export function checkForUpdates(): void {
  const notifier = updateNotifier({
    pkg: { name: PACKAGE_NAME, version: PACKAGE_VERSION },
    updateCheckInterval: 1000 * 60 * 60 * 24, // 1 day
  });

  notifier.notify({
    isGlobal: true,
    message: `Update available: {currentVersion} → {latestVersion}\nRun \`npm i -g ${PACKAGE_NAME}\` to update`,
  });
}
