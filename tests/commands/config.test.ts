import { describe, expect, test, beforeEach, afterEach, spyOn, type Mock } from 'bun:test';
import { Command } from 'commander';
import { configCommand } from '../../src/commands/config/index.js';
import * as config from '../../src/lib/config.js';

// Store original console methods
let originalLog: typeof console.log;
let originalError: typeof console.error;
let logs: string[];
let errors: string[];

// Store original process.exit
let originalExit: typeof process.exit;
let exitCode: number | undefined;

// Store spies for cleanup

type AnyMock = Mock<(...args: any[]) => any>;
let spies: AnyMock[];

// Helper to track spies

function trackSpy<T extends (...args: any[]) => any>(spy: Mock<T>): Mock<T> {
  spies.push(spy as AnyMock);
  return spy;
}

beforeEach(() => {
  spies = [];

  // Capture console output
  logs = [];
  errors = [];
  originalLog = console.log;
  originalError = console.error;
  console.log = (...args: unknown[]) => logs.push(args.map(String).join(' '));
  console.error = (...args: unknown[]) => errors.push(args.map(String).join(' '));

  // Mock process.exit
  originalExit = process.exit;
  exitCode = undefined;
  process.exit = ((code?: number) => {
    exitCode = code;
    throw new Error(`process.exit(${code})`);
  }) as typeof process.exit;
});

afterEach(() => {
  console.log = originalLog;
  console.error = originalError;
  process.exit = originalExit;

  // Restore all spies
  spies.forEach((spy) => {
    spy.mockRestore();
  });
});

describe('config get command', () => {
  test('outputs config value', async () => {
    trackSpy(spyOn(config, 'getConfigValue').mockReturnValue('json'));

    const program = new Command();
    program.addCommand(configCommand);
    await program.parseAsync(['node', 'test', 'config', 'get', 'defaultOutput']);

    expect(logs).toContain('json');
  });

  test('handles boolean config value', async () => {
    trackSpy(spyOn(config, 'getConfigValue').mockReturnValue(true));

    const program = new Command();
    program.addCommand(configCommand);
    await program.parseAsync(['node', 'test', 'config', 'get', 'sandbox']);

    expect(logs).toContain('true');
  });

  test('handles error for invalid key', async () => {
    trackSpy(
      spyOn(config, 'getConfigValue').mockImplementation(() => {
        throw new Error('Unknown config key: invalid');
      }),
    );

    const program = new Command();
    program.addCommand(configCommand);

    try {
      await program.parseAsync(['node', 'test', 'config', 'get', 'invalid']);
    } catch (_e) {
      // Expected - handleError calls process.exit
    }

    expect(exitCode).toBe(1);
  });
});

describe('config set command', () => {
  test('sets config value and shows success', async () => {
    const setValueSpy = trackSpy(spyOn(config, 'setConfigValue').mockImplementation(() => {}));

    const program = new Command();
    program.addCommand(configCommand);
    await program.parseAsync(['node', 'test', 'config', 'set', 'sandbox', 'true']);

    expect(setValueSpy).toHaveBeenCalledWith('sandbox', 'true');
    expect(logs.some((l) => l.includes('Set sandbox = true'))).toBe(true);
  });

  test('sets output format', async () => {
    const setValueSpy = trackSpy(spyOn(config, 'setConfigValue').mockImplementation(() => {}));

    const program = new Command();
    program.addCommand(configCommand);
    await program.parseAsync(['node', 'test', 'config', 'set', 'defaultOutput', 'json']);

    expect(setValueSpy).toHaveBeenCalledWith('defaultOutput', 'json');
  });

  test('handles error for invalid value', async () => {
    trackSpy(
      spyOn(config, 'setConfigValue').mockImplementation(() => {
        throw new Error('Invalid value');
      }),
    );

    const program = new Command();
    program.addCommand(configCommand);

    try {
      await program.parseAsync(['node', 'test', 'config', 'set', 'sandbox', 'invalid']);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });
});

describe('config list command', () => {
  test('displays all config values', async () => {
    trackSpy(
      spyOn(config, 'getAllConfig').mockReturnValue({
        sandbox: false,
        defaultOutput: 'table',
        credentials: {
          apiUser: 'testuser',
          apiKey: 'secret-key',
          userName: 'testuser',
          clientIp: '127.0.0.1',
        },
      }),
    );
    trackSpy(
      spyOn(config, 'getConfigPath').mockReturnValue('/home/user/.config/namecheap/config.json'),
    );

    const program = new Command();
    program.addCommand(configCommand);
    await program.parseAsync(['node', 'test', 'config', 'list']);

    expect(logs.some((l) => l.includes('Configuration'))).toBe(true);
    expect(logs.some((l) => l.includes('sandbox'))).toBe(true);
    expect(logs.some((l) => l.includes('defaultOutput'))).toBe(true);
    expect(logs.some((l) => l.includes('testuser'))).toBe(true);
    expect(logs.some((l) => l.includes('***hidden***'))).toBe(true);
    // API key should NOT be visible
    expect(logs.some((l) => l.includes('secret-key'))).toBe(false);
  });

  test('displays config without credentials', async () => {
    trackSpy(
      spyOn(config, 'getAllConfig').mockReturnValue({
        sandbox: true,
        defaultOutput: 'json',
        credentials: undefined,
      }),
    );
    trackSpy(spyOn(config, 'getConfigPath').mockReturnValue('/config/path'));

    const program = new Command();
    program.addCommand(configCommand);
    await program.parseAsync(['node', 'test', 'config', 'list']);

    expect(logs.some((l) => l.includes('sandbox'))).toBe(true);
    expect(logs.some((l) => l.includes('json'))).toBe(true);
  });

  test('outputs JSON with --json flag', async () => {
    trackSpy(
      spyOn(config, 'getAllConfig').mockReturnValue({
        sandbox: false,
        defaultOutput: 'table',
        credentials: {
          apiUser: 'testuser',
          apiKey: 'secret-key',
          userName: 'testuser',
          clientIp: '127.0.0.1',
        },
      }),
    );
    trackSpy(spyOn(config, 'getConfigPath').mockReturnValue('/config/path'));

    const program = new Command();
    program.addCommand(configCommand);
    await program.parseAsync(['node', 'test', 'config', 'list', '--json']);

    const jsonOutput = logs.find((l) => l.includes('sandbox'));
    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput!);
    expect(parsed.sandbox).toBe(false);
    expect(parsed.defaultOutput).toBe('table');
    expect(parsed.configPath).toBe('/config/path');
    expect(parsed.credentials.apiKey).toBe('***hidden***');
  });
});

describe('config path command', () => {
  test('outputs config file path', async () => {
    trackSpy(
      spyOn(config, 'getConfigPath').mockReturnValue('/home/user/.config/namecheap/config.json'),
    );

    const program = new Command();
    program.addCommand(configCommand);
    await program.parseAsync(['node', 'test', 'config', 'path']);

    expect(logs).toContain('/home/user/.config/namecheap/config.json');
  });
});
