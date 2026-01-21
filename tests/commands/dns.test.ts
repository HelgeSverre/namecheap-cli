import { describe, expect, test, beforeEach, afterEach, mock, spyOn, type Mock } from 'bun:test';
import { Command } from 'commander';
import { listCommand } from '../../src/commands/dns/list.js';
import { addCommand } from '../../src/commands/dns/add.js';
import { rmCommand } from '../../src/commands/dns/rm.js';
import { emailCommand } from '../../src/commands/dns/email.js';
import * as client from '../../src/lib/api/client.js';
import * as dnsApi from '../../src/lib/api/dns.js';
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

describe('dns list command', () => {
  test('lists DNS records in table format', async () => {
    trackSpy(
      spyOn(dnsApi, 'getDnsHosts').mockResolvedValue([
        { hostId: '1', type: 'A', name: '@', address: '1.2.3.4', ttl: 1800, isActive: true },
        {
          hostId: '2',
          type: 'CNAME',
          name: 'www',
          address: 'example.com',
          ttl: 1800,
          isActive: true,
        },
        {
          hostId: '3',
          type: 'MX',
          name: '@',
          address: 'mail.example.com',
          ttl: 1800,
          mxPref: 10,
          isActive: true,
        },
      ]),
    );

    const program = new Command();
    program.addCommand(listCommand);
    await program.parseAsync(['node', 'test', 'list', 'example.com']);

    expect(logs.some((l) => l.includes('1.2.3.4'))).toBe(true);
    expect(logs.some((l) => l.includes('CNAME'))).toBe(true);
    expect(logs.some((l) => l.includes('mail.example.com'))).toBe(true);
    expect(logs.some((l) => l.includes('Total: 3 record(s)'))).toBe(true);
  });

  test('shows message when no records found', async () => {
    trackSpy(spyOn(dnsApi, 'getDnsHosts').mockResolvedValue([]));

    const program = new Command();
    program.addCommand(listCommand);
    await program.parseAsync(['node', 'test', 'list', 'example.com']);

    expect(logs.some((l) => l.includes('No DNS records found'))).toBe(true);
  });

  test('outputs JSON with --json flag', async () => {
    trackSpy(
      spyOn(dnsApi, 'getDnsHosts').mockResolvedValue([
        { hostId: '1', type: 'A', name: '@', address: '1.2.3.4', ttl: 1800, isActive: true },
      ]),
    );

    const program = new Command();
    program.addCommand(listCommand);
    await program.parseAsync(['node', 'test', 'list', 'example.com', '--json']);

    const jsonOutput = logs.find((l) => l.includes('hostId'));
    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput!);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].type).toBe('A');
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

  test('truncates long addresses', async () => {
    const longAddress = 'v=DKIM1; k=rsa; p=' + 'A'.repeat(100);
    trackSpy(
      spyOn(dnsApi, 'getDnsHosts').mockResolvedValue([
        { hostId: '1', type: 'TXT', name: 'dkim', address: longAddress, ttl: 1800, isActive: true },
      ]),
    );

    const program = new Command();
    program.addCommand(listCommand);
    await program.parseAsync(['node', 'test', 'list', 'example.com']);

    // Address should be truncated with ...
    expect(logs.some((l) => l.includes('...'))).toBe(true);
  });
});

describe('dns add command', () => {
  test('adds DNS record with CLI options', async () => {
    const addDnsRecordSpy = trackSpy(spyOn(dnsApi, 'addDnsRecord').mockResolvedValue(true));

    const program = new Command();
    program.addCommand(addCommand);
    await program.parseAsync([
      'node',
      'test',
      'add',
      'example.com',
      '--type',
      'A',
      '--name',
      '@',
      '--value',
      '1.2.3.4',
      '--ttl',
      '3600',
    ]);

    expect(addDnsRecordSpy).toHaveBeenCalledWith(
      expect.anything(),
      'example.com',
      expect.objectContaining({
        type: 'A',
        name: '@',
        address: '1.2.3.4',
        ttl: 3600,
      }),
    );
    expect(logs.some((l) => l.includes('Added A record'))).toBe(true);
  });

  test('adds MX record with priority', async () => {
    const addDnsRecordSpy = trackSpy(spyOn(dnsApi, 'addDnsRecord').mockResolvedValue(true));

    const program = new Command();
    program.addCommand(addCommand);
    await program.parseAsync([
      'node',
      'test',
      'add',
      'example.com',
      '--type',
      'MX',
      '--name',
      '@',
      '--value',
      'mail.example.com',
      '--mx-pref',
      '10',
    ]);

    expect(addDnsRecordSpy).toHaveBeenCalledWith(
      expect.anything(),
      'example.com',
      expect.objectContaining({
        type: 'MX',
        mxPref: 10,
      }),
    );
  });

  test('validates record type', async () => {
    const program = new Command();
    program.addCommand(addCommand);

    try {
      await program.parseAsync([
        'node',
        'test',
        'add',
        'example.com',
        '--type',
        'INVALID',
        '--name',
        '@',
        '--value',
        '1.2.3.4',
      ]);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });

  test('requires all options in non-TTY mode', async () => {
    spyOn(spinner, 'isTTY').mockReturnValue(false);

    const program = new Command();
    program.addCommand(addCommand);

    try {
      await program.parseAsync(['node', 'test', 'add', 'example.com', '--type', 'A']);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });
});

describe('dns rm command', () => {
  test('removes DNS record with --force', async () => {
    trackSpy(
      spyOn(dnsApi, 'getDnsHosts').mockResolvedValue([
        { hostId: '123', type: 'A', name: '@', address: '1.2.3.4', ttl: 1800, isActive: true },
      ]),
    );

    const deleteSpy = trackSpy(spyOn(dnsApi, 'deleteDnsRecord').mockResolvedValue(true));

    const program = new Command();
    program.addCommand(rmCommand);
    await program.parseAsync(['node', 'test', 'rm', 'example.com', '123', '--force']);

    expect(deleteSpy).toHaveBeenCalledWith(expect.anything(), 'example.com', '123');
    expect(logs.some((l) => l.includes('Deleted record 123'))).toBe(true);
  });

  test('shows record details before deletion', async () => {
    trackSpy(
      spyOn(dnsApi, 'getDnsHosts').mockResolvedValue([
        {
          hostId: '123',
          type: 'CNAME',
          name: 'www',
          address: 'example.com',
          ttl: 1800,
          isActive: true,
        },
      ]),
    );

    trackSpy(spyOn(dnsApi, 'deleteDnsRecord').mockResolvedValue(true));
    trackSpy(spyOn(prompts, 'confirmDangerousOperation').mockResolvedValue(true as boolean));

    const program = new Command();
    program.addCommand(rmCommand);
    await program.parseAsync(['node', 'test', 'rm', 'example.com', '123']);

    expect(logs.some((l) => l.includes('Type: CNAME'))).toBe(true);
    expect(logs.some((l) => l.includes('Name: www'))).toBe(true);
  });

  test('cancels when user declines confirmation', async () => {
    trackSpy(
      spyOn(dnsApi, 'getDnsHosts').mockResolvedValue([
        { hostId: '123', type: 'A', name: '@', address: '1.2.3.4', ttl: 1800, isActive: true },
      ]),
    );

    trackSpy(spyOn(dnsApi, 'deleteDnsRecord').mockResolvedValue(true));
    trackSpy(spyOn(prompts, 'confirmDangerousOperation').mockResolvedValue(false as boolean));

    const program = new Command();
    program.addCommand(rmCommand);
    await program.parseAsync(['node', 'test', 'rm', 'example.com', '123']);

    // When cancelled, no success message should be shown
    expect(logs.some((l) => l.includes('Deleted record'))).toBe(false);
    expect(warns.some((w) => w.includes('cancelled'))).toBe(true);
  });

  test('errors when record ID not found', async () => {
    trackSpy(
      spyOn(dnsApi, 'getDnsHosts').mockResolvedValue([
        { hostId: '999', type: 'A', name: '@', address: '1.2.3.4', ttl: 1800, isActive: true },
      ]),
    );

    const program = new Command();
    program.addCommand(rmCommand);

    try {
      await program.parseAsync(['node', 'test', 'rm', 'example.com', '123', '--force']);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });
});

describe('dns email list command', () => {
  test('lists email forwards', async () => {
    trackSpy(
      spyOn(dnsApi, 'getEmailForwarding').mockResolvedValue([
        { mailbox: 'info', forwardTo: 'admin@gmail.com' },
        { mailbox: 'support', forwardTo: 'help@gmail.com' },
      ]),
    );

    const program = new Command();
    program.addCommand(emailCommand);
    await program.parseAsync(['node', 'test', 'email', 'list', 'example.com']);

    expect(logs.some((l) => l.includes('info@example.com'))).toBe(true);
    expect(logs.some((l) => l.includes('admin@gmail.com'))).toBe(true);
    expect(logs.some((l) => l.includes('2 forwarding rule(s)'))).toBe(true);
  });

  test('shows message when no forwards configured', async () => {
    trackSpy(spyOn(dnsApi, 'getEmailForwarding').mockResolvedValue([]));

    const program = new Command();
    program.addCommand(emailCommand);
    await program.parseAsync(['node', 'test', 'email', 'list', 'example.com']);

    expect(logs.some((l) => l.includes('No email forwarding rules'))).toBe(true);
  });

  test('outputs JSON with --json flag', async () => {
    trackSpy(
      spyOn(dnsApi, 'getEmailForwarding').mockResolvedValue([
        { mailbox: 'info', forwardTo: 'admin@gmail.com' },
      ]),
    );

    const program = new Command();
    program.addCommand(emailCommand);
    await program.parseAsync(['node', 'test', 'email', 'list', 'example.com', '--json']);

    const jsonOutput = logs.find((l) => l.includes('mailbox'));
    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput!);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].mailbox).toBe('info');
  });
});

describe('dns email add command', () => {
  test('adds email forward with options', async () => {
    const addSpy = trackSpy(spyOn(dnsApi, 'addEmailForward').mockResolvedValue(true));

    const program = new Command();
    program.addCommand(emailCommand);
    await program.parseAsync([
      'node',
      'test',
      'email',
      'add',
      'example.com',
      '--mailbox',
      'info',
      '--forward-to',
      'admin@gmail.com',
    ]);

    expect(addSpy).toHaveBeenCalledWith(
      expect.anything(),
      'example.com',
      'info',
      'admin@gmail.com',
    );
    expect(logs.some((l) => l.includes('info@example.com'))).toBe(true);
  });

  test('strips domain from mailbox input', async () => {
    const addSpy = trackSpy(spyOn(dnsApi, 'addEmailForward').mockResolvedValue(true));

    const program = new Command();
    program.addCommand(emailCommand);
    await program.parseAsync([
      'node',
      'test',
      'email',
      'add',
      'example.com',
      '--mailbox',
      'info@example.com',
      '--forward-to',
      'admin@gmail.com',
    ]);

    // Should strip the @example.com part
    expect(addSpy).toHaveBeenCalledWith(
      expect.anything(),
      'example.com',
      'info',
      'admin@gmail.com',
    );
  });
});

describe('dns email rm command', () => {
  test('removes email forward with --force', async () => {
    const removeSpy = trackSpy(spyOn(dnsApi, 'removeEmailForward').mockResolvedValue(true));

    const program = new Command();
    program.addCommand(emailCommand);
    await program.parseAsync(['node', 'test', 'email', 'rm', 'example.com', 'info', '--force']);

    expect(removeSpy).toHaveBeenCalledWith(expect.anything(), 'example.com', 'info');
    expect(logs.some((l) => l.includes('Email forward removed'))).toBe(true);
  });
});
