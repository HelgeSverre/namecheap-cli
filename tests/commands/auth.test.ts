import { describe, expect, test, beforeEach, afterEach, spyOn, type Mock } from 'bun:test';
import { Command } from 'commander';
import { logoutCommand } from '../../src/commands/auth/logout.js';
import { statusCommand } from '../../src/commands/auth/status.js';
import * as config from '../../src/lib/config.js';
import * as client from '../../src/lib/api/client.js';
import * as spinner from '../../src/utils/spinner.js';

// Store original console methods
let originalLog: typeof console.log;
let originalError: typeof console.error;
let originalWarn: typeof console.warn;
let logs: string[];
let errors: string[];
let warns: string[];

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
  warns = [];
  originalLog = console.log;
  originalError = console.error;
  originalWarn = console.warn;
  console.log = (...args: unknown[]) => logs.push(args.map(String).join(' '));
  console.error = (...args: unknown[]) => errors.push(args.map(String).join(' '));
  console.warn = (...args: unknown[]) => warns.push(args.map(String).join(' '));

  // Mock process.exit
  originalExit = process.exit;
  exitCode = undefined;
  process.exit = ((code?: number) => {
    exitCode = code;
    throw new Error(`process.exit(${code})`);
  }) as typeof process.exit;

  // Mock withSpinner to just execute the function (but catch errors)
  trackSpy(
    spyOn(spinner, 'withSpinner').mockImplementation(
      async <T>(_text: string, fn: () => Promise<T>): Promise<any> => {
        try {
          return await fn();
        } catch {
          return undefined;
        }
      },
    ),
  );
});

afterEach(() => {
  console.log = originalLog;
  console.error = originalError;
  console.warn = originalWarn;
  process.exit = originalExit;

  // Restore all spies
  spies.forEach((spy) => {
    spy.mockRestore();
  });
});

describe('auth logout command', () => {
  test('shows warning when not authenticated', async () => {
    trackSpy(spyOn(config, 'isAuthenticated').mockReturnValue(false));

    const program = new Command();
    program.addCommand(logoutCommand);
    await program.parseAsync(['node', 'test', 'logout']);

    expect(warns.some((w) => w.includes('Not currently authenticated'))).toBe(true);
  });

  test('clears credentials when authenticated', async () => {
    trackSpy(spyOn(config, 'isAuthenticated').mockReturnValue(true));
    const clearCredentialsSpy = trackSpy(
      spyOn(config, 'clearCredentials').mockImplementation(() => {}),
    );
    const clearClientSpy = trackSpy(spyOn(client, 'clearClient').mockImplementation(() => {}));

    const program = new Command();
    program.addCommand(logoutCommand);
    await program.parseAsync(['node', 'test', 'logout']);

    expect(clearCredentialsSpy).toHaveBeenCalled();
    expect(clearClientSpy).toHaveBeenCalled();
    expect(logs.some((l) => l.includes('Successfully logged out'))).toBe(true);
  });
});

describe('auth status command', () => {
  test('shows not authenticated when no credentials', async () => {
    trackSpy(spyOn(config, 'isAuthenticated').mockReturnValue(false));

    const program = new Command();
    program.addCommand(statusCommand);

    try {
      await program.parseAsync(['node', 'test', 'status']);
    } catch (_e) {
      // Expected - process.exit is called
    }

    expect(exitCode).toBe(1);
    expect(errors.some((e) => e.includes('Not authenticated'))).toBe(true);
  });

  test('outputs JSON when not authenticated with --json', async () => {
    trackSpy(spyOn(config, 'isAuthenticated').mockReturnValue(false));

    const program = new Command();
    program.addCommand(statusCommand);

    try {
      await program.parseAsync(['node', 'test', 'status', '--json']);
    } catch (_e) {
      // Expected - process.exit is called
    }

    expect(exitCode).toBe(1);
    const jsonOutput = logs.find((l) => l.includes('authenticated'));
    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput!);
    expect(parsed.authenticated).toBe(false);
  });

  test('shows authenticated status when credentials exist', async () => {
    trackSpy(spyOn(config, 'isAuthenticated').mockReturnValue(true));
    trackSpy(
      spyOn(config, 'getCredentials').mockReturnValue({
        apiUser: 'testuser',
        apiKey: 'testkey',
        userName: 'testuser',
        clientIp: '127.0.0.1',
      }),
    );
    trackSpy(spyOn(config, 'isSandboxMode').mockReturnValue(false));
    trackSpy(spyOn(config, 'getConfigPath').mockReturnValue('/path/to/config'));

    const program = new Command();
    program.addCommand(statusCommand);
    await program.parseAsync(['node', 'test', 'status']);

    expect(logs.some((l) => l.includes('Authenticated'))).toBe(true);
    expect(logs.some((l) => l.includes('testuser'))).toBe(true);
  });

  test('shows JSON output when authenticated (balance may be null if API fails)', async () => {
    trackSpy(spyOn(config, 'isAuthenticated').mockReturnValue(true));
    trackSpy(
      spyOn(config, 'getCredentials').mockReturnValue({
        apiUser: 'testuser',
        apiKey: 'testkey',
        userName: 'testuser',
        clientIp: '127.0.0.1',
      }),
    );
    trackSpy(spyOn(config, 'isSandboxMode').mockReturnValue(true));
    trackSpy(spyOn(config, 'getConfigPath').mockReturnValue('/path/to/config'));

    const program = new Command();
    program.addCommand(statusCommand);
    await program.parseAsync(['node', 'test', 'status', '--json']);

    const jsonOutput = logs.find((l) => l.includes('authenticated'));
    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput!);
    expect(parsed.authenticated).toBe(true);
    expect(parsed.user).toBe('testuser');
    expect(parsed.apiUser).toBe('testuser');
    expect(parsed.clientIp).toBe('127.0.0.1');
    expect(parsed.sandbox).toBe(true);
    expect(parsed.configPath).toBe('/path/to/config');
    // Balance is null when the API call fails (which is expected in test)
    expect(parsed.balance).toBe(null);
  });
});
