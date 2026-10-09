import { describe, expect, test, beforeEach, afterEach, spyOn, type Mock } from 'bun:test';
import { Command } from 'commander';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { uninstallCommand } from '../../src/commands/uninstall/index.js';
import * as uninstall from '../../src/lib/uninstall.js';
import * as prompts from '../../src/utils/prompts.js';

type AnyMock = Mock<(...args: any[]) => any>;
let spies: AnyMock[];
function trackSpy<T extends (...args: any[]) => any>(spy: Mock<T>): Mock<T> {
  spies.push(spy as AnyMock);
  return spy;
}

let originalLog: typeof console.log;
let originalError: typeof console.error;
let originalWarn: typeof console.warn;
let originalExit: typeof process.exit;
let originalIsTTY: boolean | undefined;
let logs: string[];
let errors: string[];
let exitCode: number | undefined;

const sandbox = join(process.env.HOME!, 'uninstall-cmd-test');
let items: uninstall.FootprintItem[];

function run(...args: string[]) {
  const program = new Command();
  program.addCommand(uninstallCommand);
  return program.parseAsync(['node', 'test', 'uninstall', ...args]);
}

beforeEach(() => {
  spies = [];
  logs = [];
  errors = [];
  originalLog = console.log;
  originalError = console.error;
  originalWarn = console.warn;
  console.log = (...args: unknown[]) => logs.push(args.map(String).join(' '));
  console.error = (...args: unknown[]) => errors.push(args.map(String).join(' '));
  console.warn = (...args: unknown[]) => errors.push(args.map(String).join(' '));

  originalExit = process.exit;
  exitCode = undefined;
  process.exit = (code?: number) => {
    exitCode = code;
    throw new Error(`process.exit(${code})`);
  };
  originalIsTTY = process.stdin.isTTY;

  // Never let the command see real (e.g. Homebrew) paths: use sandboxed files only
  items = [
    {
      kind: 'config',
      description: 'Config and stored API credentials',
      path: join(sandbox, 'config', 'config.json'),
      pruneDirIfEmpty: join(sandbox, 'config'),
    },
    { kind: 'completion', description: 'zsh completion script', path: join(sandbox, '_namecheap') },
  ];
  for (const item of items) {
    mkdirSync(dirname(item.path), { recursive: true });
    writeFileSync(item.path, 'x');
  }
  trackSpy(
    spyOn(uninstall, 'findFootprint').mockImplementation(() =>
      items.filter((i) => existsSync(i.path)),
    ),
  );
  trackSpy(
    spyOn(uninstall, 'detectCurrentInstall').mockReturnValue({
      method: 'npm',
      command: 'npm uninstall -g @helgesverre/namecheap-cli',
    }),
  );
});

afterEach(() => {
  console.log = originalLog;
  console.error = originalError;
  console.warn = originalWarn;
  process.exit = originalExit;
  process.stdin.isTTY = originalIsTTY!;
  process.exitCode = 0;
  spies.forEach((spy) => spy.mockRestore());
});

describe('uninstall command', () => {
  test('--dry-run lists files and removes nothing', async () => {
    await run('--dry-run');

    expect(logs.some((l) => l.includes('Dry run'))).toBe(true);
    expect(logs.some((l) => l.includes(items[0]!.path))).toBe(true);
    expect(logs.some((l) => l.includes('npm uninstall -g @helgesverre/namecheap-cli'))).toBe(true);
    expect(items.every((i) => existsSync(i.path))).toBe(true);
  });

  test('--dry-run --json reports what would be removed', async () => {
    await run('--dry-run', '--json');

    const parsed = JSON.parse(logs.join('\n'));
    expect(parsed.dryRun).toBe(true);
    expect(parsed.wouldRemove).toEqual([
      { kind: 'config', path: items[0]!.path },
      { kind: 'completion', path: items[1]!.path },
    ]);
    expect(parsed.packageUninstallCommand).toBe('npm uninstall -g @helgesverre/namecheap-cli');
    expect(items.every((i) => existsSync(i.path))).toBe(true);
  });

  test('--force removes files without prompting', async () => {
    const confirmSpy = trackSpy(spyOn(prompts, 'promptConfirm'));

    await run('--force');

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(items.some((i) => existsSync(i.path))).toBe(false);
    expect(existsSync(join(sandbox, 'config'))).toBe(false);
    expect(logs.some((l) => l.includes('Removed config and stored api credentials'))).toBe(true);
    expect(logs.some((l) => l.includes('npm uninstall -g'))).toBe(true);
  });

  test('--yes is an alias for --force', async () => {
    await run('--yes');
    expect(items.some((i) => existsSync(i.path))).toBe(false);
  });

  test('prompts and removes when confirmed', async () => {
    process.stdin.isTTY = true;
    const confirmSpy = trackSpy(spyOn(prompts, 'promptConfirm').mockResolvedValue(true));

    await run();

    expect(confirmSpy).toHaveBeenCalled();
    expect(logs.some((l) => l.includes('will be removed'))).toBe(true);
    expect(items.some((i) => existsSync(i.path))).toBe(false);
  });

  test('keeps files when the prompt is declined', async () => {
    process.stdin.isTTY = true;
    trackSpy(spyOn(prompts, 'promptConfirm').mockResolvedValue(false));

    await run();

    expect(errors.some((l) => l.includes('cancelled'))).toBe(true);
    expect(items.every((i) => existsSync(i.path))).toBe(true);
  });

  test('refuses to run unconfirmed in a non-interactive shell', async () => {
    process.stdin.isTTY = false;

    try {
      await run();
    } catch (_e) {
      // process.exit mock throws
    }

    expect(exitCode).toBe(1);
    expect(items.every((i) => existsSync(i.path))).toBe(true);
  });

  test('reports when there is nothing to remove', async () => {
    items = [];

    await run('--force');

    expect(logs.some((l) => l.includes('Nothing to remove'))).toBe(true);
  });
});
