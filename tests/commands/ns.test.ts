import { describe, expect, test, beforeEach, afterEach, mock, spyOn, type Mock } from 'bun:test';
import { Command } from 'commander';
import { listCommand } from '../../src/commands/ns/list.js';
import { setCommand } from '../../src/commands/ns/set.js';
import { resetCommand } from '../../src/commands/ns/reset.js';
import { createCommand } from '../../src/commands/ns/create.js';
import { deleteCommand } from '../../src/commands/ns/delete.js';
import { infoCommand } from '../../src/commands/ns/info.js';
import { updateCommand } from '../../src/commands/ns/update.js';
import * as client from '../../src/lib/api/client.js';
import * as dnsApi from '../../src/lib/api/dns.js';
import * as nsApi from '../../src/lib/api/ns.js';
import * as spinner from '../../src/utils/spinner.js';
import * as prompts from '../../src/utils/prompts.js';

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

// Mock client
const mockClient = {
  request: mock(() => Promise.resolve({ success: true, errors: [], warnings: [], data: {} })),
  post: mock(() => Promise.resolve({ success: true, errors: [], warnings: [], data: {} })),
};

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

  // Mock getClient
  trackSpy(
    spyOn(client, 'getClient').mockReturnValue(mockClient as unknown as client.NamecheapClient),
  );

  // Mock withSpinner to just execute the function
  trackSpy(spyOn(spinner, 'withSpinner').mockImplementation(async (_text, fn) => fn()));
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

describe('ns list command', () => {
  test('lists nameservers using Namecheap DNS', async () => {
    trackSpy(
      spyOn(dnsApi, 'getNameservers').mockResolvedValue({
        domain: 'example.com',
        isUsingOurDns: true,
        nameservers: ['dns1.registrar-servers.com', 'dns2.registrar-servers.com'],
      }),
    );

    const program = new Command();
    program.addCommand(listCommand);
    await program.parseAsync(['node', 'test', 'list', 'example.com']);

    expect(logs.some((l) => l.includes('Nameservers for example.com'))).toBe(true);
    expect(logs.some((l) => l.includes('Namecheap BasicDNS'))).toBe(true);
    expect(logs.some((l) => l.includes('dns1.registrar-servers.com'))).toBe(true);
    expect(logs.some((l) => l.includes('dns2.registrar-servers.com'))).toBe(true);
  });

  test('lists custom nameservers', async () => {
    trackSpy(
      spyOn(dnsApi, 'getNameservers').mockResolvedValue({
        domain: 'example.com',
        isUsingOurDns: false,
        nameservers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
      }),
    );

    const program = new Command();
    program.addCommand(listCommand);
    await program.parseAsync(['node', 'test', 'list', 'example.com']);

    expect(logs.some((l) => l.includes('custom nameservers'))).toBe(true);
    expect(logs.some((l) => l.includes('ns1.cloudflare.com'))).toBe(true);
  });

  test('outputs JSON with --json flag', async () => {
    trackSpy(
      spyOn(dnsApi, 'getNameservers').mockResolvedValue({
        domain: 'example.com',
        isUsingOurDns: true,
        nameservers: ['dns1.registrar-servers.com', 'dns2.registrar-servers.com'],
      }),
    );

    const program = new Command();
    program.addCommand(listCommand);
    await program.parseAsync(['node', 'test', 'list', 'example.com', '--json']);

    const jsonOutput = logs.find((l) => l.includes('isUsingOurDns'));
    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput!);
    expect(parsed.isUsingOurDns).toBe(true);
    expect(parsed.nameservers).toHaveLength(2);
  });

  test('validates domain argument', async () => {
    const program = new Command();
    program.addCommand(listCommand);

    try {
      await program.parseAsync(['node', 'test', 'list', 'invalid']);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });
});

describe('ns set command', () => {
  test('sets custom nameservers', async () => {
    const setSpy = trackSpy(spyOn(dnsApi, 'setCustomNameservers').mockResolvedValue(true));

    const program = new Command();
    program.addCommand(setCommand);
    await program.parseAsync([
      'node',
      'test',
      'set',
      'example.com',
      'ns1.cloudflare.com',
      'ns2.cloudflare.com',
    ]);

    expect(setSpy).toHaveBeenCalledWith(expect.anything(), 'example.com', [
      'ns1.cloudflare.com',
      'ns2.cloudflare.com',
    ]);
    expect(logs.some((l) => l.includes('Set 2 nameservers'))).toBe(true);
  });

  test('requires at least 2 nameservers', async () => {
    const program = new Command();
    program.addCommand(setCommand);

    try {
      await program.parseAsync(['node', 'test', 'set', 'example.com', 'ns1.cloudflare.com']);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });

  test('limits to maximum 5 nameservers', async () => {
    const program = new Command();
    program.addCommand(setCommand);

    try {
      await program.parseAsync([
        'node',
        'test',
        'set',
        'example.com',
        'ns1.a.com',
        'ns2.a.com',
        'ns3.a.com',
        'ns4.a.com',
        'ns5.a.com',
        'ns6.a.com',
      ]);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });

  test('displays all set nameservers', async () => {
    trackSpy(spyOn(dnsApi, 'setCustomNameservers').mockResolvedValue(true));

    const program = new Command();
    program.addCommand(setCommand);
    await program.parseAsync([
      'node',
      'test',
      'set',
      'example.com',
      'ns1.provider.com',
      'ns2.provider.com',
      'ns3.provider.com',
    ]);

    expect(logs.some((l) => l.includes('Set 3 nameservers'))).toBe(true);
    expect(logs.some((l) => l.includes('1. ns1.provider.com'))).toBe(true);
    expect(logs.some((l) => l.includes('2. ns2.provider.com'))).toBe(true);
    expect(logs.some((l) => l.includes('3. ns3.provider.com'))).toBe(true);
  });
});

describe('ns reset command', () => {
  test('resets nameservers with --force', async () => {
    const resetSpy = trackSpy(spyOn(dnsApi, 'setDefaultNameservers').mockResolvedValue(true));

    const program = new Command();
    program.addCommand(resetCommand);
    await program.parseAsync(['node', 'test', 'reset', 'example.com', '--force']);

    expect(resetSpy).toHaveBeenCalledWith(expect.anything(), 'example.com');
    expect(logs.some((l) => l.includes('Reset nameservers'))).toBe(true);
    expect(logs.some((l) => l.includes('Namecheap defaults'))).toBe(true);
  });

  test('prompts for confirmation without --force', async () => {
    trackSpy(spyOn(dnsApi, 'setDefaultNameservers').mockResolvedValue(true));
    const confirmSpy = trackSpy(
      spyOn(prompts, 'confirmDangerousOperation').mockResolvedValue(true as boolean),
    );

    const program = new Command();
    program.addCommand(resetCommand);
    await program.parseAsync(['node', 'test', 'reset', 'example.com']);

    expect(confirmSpy).toHaveBeenCalled();
    expect(logs.some((l) => l.includes('Reset nameservers'))).toBe(true);
  });

  test('cancels when user declines confirmation', async () => {
    trackSpy(spyOn(dnsApi, 'setDefaultNameservers').mockResolvedValue(true));
    trackSpy(spyOn(prompts, 'confirmDangerousOperation').mockResolvedValue(false as boolean));

    const program = new Command();
    program.addCommand(resetCommand);
    await program.parseAsync(['node', 'test', 'reset', 'example.com']);

    // When cancelled, no success message should be shown
    expect(logs.some((l) => l.includes('Reset nameservers'))).toBe(false);
    expect(warns.some((w) => w.includes('cancelled'))).toBe(true);
  });
});

describe('ns create command', () => {
  test('creates child nameserver', async () => {
    const createSpy = trackSpy(spyOn(nsApi, 'createChildNameserver').mockResolvedValue(true));

    const program = new Command();
    program.addCommand(createCommand);
    await program.parseAsync([
      'node',
      'test',
      'create',
      'example.com',
      'ns1.example.com',
      '1.2.3.4',
    ]);

    expect(createSpy).toHaveBeenCalledWith(
      expect.anything(),
      'example.com',
      'ns1.example.com',
      '1.2.3.4',
    );
    expect(logs.some((l) => l.includes('ns1.example.com') && l.includes('1.2.3.4'))).toBe(true);
  });

  test('validates domain argument', async () => {
    const program = new Command();
    program.addCommand(createCommand);

    try {
      await program.parseAsync(['node', 'test', 'create', 'invalid', 'ns1.invalid', '1.2.3.4']);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });

  test('validates IP address', async () => {
    const program = new Command();
    program.addCommand(createCommand);

    try {
      await program.parseAsync([
        'node',
        'test',
        'create',
        'example.com',
        'ns1.example.com',
        'notanip',
      ]);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });

  test('outputs JSON with --json flag', async () => {
    trackSpy(spyOn(nsApi, 'createChildNameserver').mockResolvedValue(true));

    const program = new Command();
    program.addCommand(createCommand);
    await program.parseAsync([
      'node',
      'test',
      'create',
      'example.com',
      'ns1.example.com',
      '1.2.3.4',
      '--json',
    ]);

    const jsonOutput = logs.find((l) => l.includes('"created"'));
    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput!);
    expect(parsed.created).toBe(true);
    expect(parsed.nameserver).toBe('ns1.example.com');
    expect(parsed.ip).toBe('1.2.3.4');
  });

  test('shows warning for nameserver not under domain', async () => {
    trackSpy(spyOn(nsApi, 'createChildNameserver').mockResolvedValue(true));

    const program = new Command();
    program.addCommand(createCommand);
    await program.parseAsync(['node', 'test', 'create', 'example.com', 'ns1.other.com', '1.2.3.4']);

    expect(logs.some((l) => l.includes('Warning') && l.includes('ns1.other.com'))).toBe(true);
  });
});

describe('ns delete command', () => {
  test('deletes child nameserver with --yes', async () => {
    const deleteSpy = trackSpy(spyOn(nsApi, 'deleteChildNameserver').mockResolvedValue(true));

    const program = new Command();
    program.addCommand(deleteCommand);
    await program.parseAsync(['node', 'test', 'delete', 'example.com', 'ns1.example.com', '--yes']);

    expect(deleteSpy).toHaveBeenCalledWith(expect.anything(), 'example.com', 'ns1.example.com');
    expect(logs.some((l) => l.includes('ns1.example.com'))).toBe(true);
  });

  test('outputs JSON with --json flag', async () => {
    trackSpy(spyOn(nsApi, 'deleteChildNameserver').mockResolvedValue(true));

    const program = new Command();
    program.addCommand(deleteCommand);
    await program.parseAsync([
      'node',
      'test',
      'delete',
      'example.com',
      'ns1.example.com',
      '--yes',
      '--json',
    ]);

    const jsonOutput = logs.find((l) => l.includes('"deleted"'));
    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput!);
    expect(parsed.deleted).toBe(true);
    expect(parsed.nameserver).toBe('ns1.example.com');
  });

  test('validates domain argument', async () => {
    const program = new Command();
    program.addCommand(deleteCommand);

    try {
      await program.parseAsync(['node', 'test', 'delete', 'invalid', 'ns1.invalid', '--yes']);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });
});

describe('ns info command', () => {
  test('displays nameserver info', async () => {
    trackSpy(
      spyOn(nsApi, 'getChildNameserverInfo').mockResolvedValue({
        nameserver: 'ns1.example.com',
        ip: '1.2.3.4',
        statuses: ['ok'],
      }),
    );

    const program = new Command();
    program.addCommand(infoCommand);
    await program.parseAsync(['node', 'test', 'info', 'example.com', 'ns1.example.com']);

    expect(logs.some((l) => l.includes('ns1.example.com'))).toBe(true);
    expect(logs.some((l) => l.includes('1.2.3.4'))).toBe(true);
  });

  test('outputs JSON with --json flag', async () => {
    trackSpy(
      spyOn(nsApi, 'getChildNameserverInfo').mockResolvedValue({
        nameserver: 'ns1.example.com',
        ip: '1.2.3.4',
        statuses: ['ok'],
      }),
    );

    const program = new Command();
    program.addCommand(infoCommand);
    await program.parseAsync(['node', 'test', 'info', 'example.com', 'ns1.example.com', '--json']);

    const jsonOutput = logs.find((l) => l.includes('"nameserver"'));
    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput!);
    expect(parsed.nameserver).toBe('ns1.example.com');
    expect(parsed.ip).toBe('1.2.3.4');
  });

  test('validates domain argument', async () => {
    const program = new Command();
    program.addCommand(infoCommand);

    try {
      await program.parseAsync(['node', 'test', 'info', 'invalid', 'ns1.invalid']);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });
});

describe('ns update command', () => {
  test('updates nameserver IP', async () => {
    trackSpy(
      spyOn(nsApi, 'getChildNameserverInfo').mockResolvedValue({
        nameserver: 'ns1.example.com',
        ip: '1.2.3.4',
        statuses: ['ok'],
      }),
    );
    const updateSpy = trackSpy(spyOn(nsApi, 'updateChildNameserver').mockResolvedValue(true));

    const program = new Command();
    program.addCommand(updateCommand);
    await program.parseAsync([
      'node',
      'test',
      'update',
      'example.com',
      'ns1.example.com',
      '5.6.7.8',
    ]);

    expect(updateSpy).toHaveBeenCalledWith(
      expect.anything(),
      'example.com',
      'ns1.example.com',
      '1.2.3.4',
      '5.6.7.8',
    );
    expect(logs.some((l) => l.includes('5.6.7.8'))).toBe(true);
  });

  test('skips update when IP already matches', async () => {
    trackSpy(
      spyOn(nsApi, 'getChildNameserverInfo').mockResolvedValue({
        nameserver: 'ns1.example.com',
        ip: '1.2.3.4',
        statuses: ['ok'],
      }),
    );
    const updateSpy = trackSpy(spyOn(nsApi, 'updateChildNameserver').mockResolvedValue(true));

    const program = new Command();
    program.addCommand(updateCommand);
    await program.parseAsync([
      'node',
      'test',
      'update',
      'example.com',
      'ns1.example.com',
      '1.2.3.4',
    ]);

    expect(updateSpy).not.toHaveBeenCalled();
    expect(logs.some((l) => l.includes('already set'))).toBe(true);
  });

  test('validates IP address', async () => {
    const program = new Command();
    program.addCommand(updateCommand);

    try {
      await program.parseAsync([
        'node',
        'test',
        'update',
        'example.com',
        'ns1.example.com',
        'notanip',
      ]);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });

  test('outputs JSON with --json flag', async () => {
    trackSpy(
      spyOn(nsApi, 'getChildNameserverInfo').mockResolvedValue({
        nameserver: 'ns1.example.com',
        ip: '1.2.3.4',
        statuses: ['ok'],
      }),
    );
    trackSpy(spyOn(nsApi, 'updateChildNameserver').mockResolvedValue(true));

    const program = new Command();
    program.addCommand(updateCommand);
    await program.parseAsync([
      'node',
      'test',
      'update',
      'example.com',
      'ns1.example.com',
      '5.6.7.8',
      '--json',
    ]);

    const jsonOutput = logs.find((l) => l.includes('"updated"'));
    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput!);
    expect(parsed.updated).toBe(true);
    expect(parsed.oldIp).toBe('1.2.3.4');
    expect(parsed.newIp).toBe('5.6.7.8');
  });
});
