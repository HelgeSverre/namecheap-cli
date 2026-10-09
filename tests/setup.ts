/**
 * Test preload (see bunfig.toml): sandbox every on-disk path the CLI touches.
 *
 * The CLI reads and writes ~/.config/namecheap-cli/config.json and installs
 * shell completions under $HOME. Tests must never touch the real files, so we
 * point HOME and NAMECHEAP_CLI_CONFIG_DIR at a throwaway directory before any
 * test module is imported, and abort if the redirect did not take effect.
 */
import { afterAll } from 'bun:test';
import { mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const sandboxHome = realpathSync(mkdtempSync(join(tmpdir(), 'namecheap-cli-test-home-')));

process.env.HOME = sandboxHome;
process.env.USERPROFILE = sandboxHome;
process.env.XDG_CONFIG_HOME = join(sandboxHome, '.config');
process.env.NAMECHEAP_CLI_CONFIG_DIR = join(sandboxHome, '.config', 'namecheap-cli');

const { getConfigPath } = await import('../src/lib/config.js');
const { getCompletionPath } = await import('../src/completions/install.js');
const { getUpdateCheckCachePath } = await import('../src/lib/uninstall.js');

for (const resolved of [
  getConfigPath(),
  getCompletionPath('bash'),
  getCompletionPath('zsh'),
  getCompletionPath('fish'),
  getUpdateCheckCachePath(),
]) {
  if (!resolved.startsWith(sandboxHome)) {
    throw new Error(`Test sandbox failed: ${resolved} is outside ${sandboxHome}`);
  }
}

afterAll(() => {
  rmSync(sandboxHome, { recursive: true, force: true });
});
