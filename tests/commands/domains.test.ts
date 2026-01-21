import { describe, expect, test, beforeEach, afterEach, mock, spyOn, type Mock } from 'bun:test';
import { Command } from 'commander';
import { listCommand } from '../../src/commands/domains/list.js';
import { infoCommand } from '../../src/commands/domains/info.js';
import * as client from '../../src/lib/api/client.js';
import * as domainsApi from '../../src/lib/api/domains.js';
import * as spinner from '../../src/utils/spinner.js';

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
  process.exit = originalExit;

  // Restore all spies
  spies.forEach((spy) => {
    spy.mockRestore();
  });
});

describe('domains list command', () => {
  test('lists domains in table format', async () => {
    trackSpy(
      spyOn(domainsApi, 'listDomains').mockResolvedValue({
        domains: [
          {
            id: 1,
            name: 'example.com',
            expires: '2025-12-31',
            created: '2020-01-01',
            autoRenew: true,
            isLocked: true,
            isExpired: false,
            whoisGuard: 'ENABLED',
            isOurDns: true,
            user: 'testuser',
            isPremium: false,
          },
          {
            id: 2,
            name: 'test.net',
            expires: '2024-06-15',
            created: '2019-05-10',
            autoRenew: false,
            isLocked: false,
            isExpired: false,
            whoisGuard: 'DISABLED',
            isOurDns: false,
            user: 'testuser',
            isPremium: false,
          },
        ],
        total: 2,
      }),
    );

    const program = new Command();
    program.addCommand(listCommand);
    await program.parseAsync(['node', 'test', 'list']);

    expect(logs.some((l) => l.includes('example.com'))).toBe(true);
    expect(logs.some((l) => l.includes('test.net'))).toBe(true);
    expect(logs.some((l) => l.includes('Total: 2 domain(s)'))).toBe(true);
  });

  test('shows message when no domains found', async () => {
    trackSpy(
      spyOn(domainsApi, 'listDomains').mockResolvedValue({
        domains: [],
        total: 0,
      }),
    );

    const program = new Command();
    program.addCommand(listCommand);
    await program.parseAsync(['node', 'test', 'list']);

    expect(logs.some((l) => l.includes('No domains found'))).toBe(true);
  });

  test('outputs JSON with --json flag', async () => {
    trackSpy(
      spyOn(domainsApi, 'listDomains').mockResolvedValue({
        domains: [
          {
            id: 1,
            name: 'example.com',
            expires: '2025-12-31',
            created: '2020-01-01',
            autoRenew: true,
            isLocked: true,
            isExpired: false,
            whoisGuard: 'ENABLED',
            isOurDns: true,
            user: 'testuser',
            isPremium: false,
          },
        ],
        total: 1,
      }),
    );

    const program = new Command();
    program.addCommand(listCommand);
    await program.parseAsync(['node', 'test', 'list', '--json']);

    const jsonOutput = logs.find((l) => l.includes('example.com'));
    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput!);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].name).toBe('example.com');
  });

  test('supports pagination options', async () => {
    const listDomainsSpy = trackSpy(
      spyOn(domainsApi, 'listDomains').mockResolvedValue({
        domains: [],
        total: 0,
      }),
    );

    const program = new Command();
    program.addCommand(listCommand);
    await program.parseAsync(['node', 'test', 'list', '--page', '2', '--page-size', '50']);

    expect(listDomainsSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ page: 2, pageSize: 50 }),
    );
  });

  test('handles API error', async () => {
    trackSpy(
      spyOn(domainsApi, 'listDomains').mockRejectedValue(
        new Error('API Error: Authentication failed'),
      ),
    );

    const program = new Command();
    program.addCommand(listCommand);

    try {
      await program.parseAsync(['node', 'test', 'list']);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });
});

describe('domains info command', () => {
  test('displays domain info in table format', async () => {
    trackSpy(
      spyOn(domainsApi, 'getDomainInfo').mockResolvedValue({
        domainName: 'example.com',
        ownerName: 'John Doe',
        status: 'active',
        isOwner: true,
        createdDate: '2020-01-01',
        expiredDate: '2025-12-31',
        modifyDate: '2024-01-01',
        isPremium: false,
        dnsProviderType: 'Namecheap BasicDNS',
        whoisGuard: {
          id: '456',
          enabled: true,
          expiredDate: '2025-12-31',
        },
      }),
    );

    const program = new Command();
    program.addCommand(infoCommand);
    await program.parseAsync(['node', 'test', 'info', 'example.com']);

    expect(logs.some((l) => l.includes('example.com'))).toBe(true);
    expect(logs.some((l) => l.includes('John Doe'))).toBe(true);
    expect(logs.some((l) => l.includes('active'))).toBe(true);
  });

  test('outputs JSON with --json flag', async () => {
    trackSpy(
      spyOn(domainsApi, 'getDomainInfo').mockResolvedValue({
        domainName: 'example.com',
        ownerName: 'John Doe',
        status: 'active',
        isOwner: true,
        createdDate: '2020-01-01',
        expiredDate: '2025-12-31',
        modifyDate: '2024-01-01',
        isPremium: false,
        dnsProviderType: 'Namecheap BasicDNS',
        whoisGuard: {
          id: '456',
          enabled: true,
          expiredDate: '2025-12-31',
        },
      }),
    );

    const program = new Command();
    program.addCommand(infoCommand);
    await program.parseAsync(['node', 'test', 'info', 'example.com', '--json']);

    const jsonOutput = logs.find((l) => l.includes('domainName'));
    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput!);
    expect(parsed.domainName).toBe('example.com');
  });

  test('validates domain argument', async () => {
    const program = new Command();
    program.addCommand(infoCommand);

    try {
      await program.parseAsync(['node', 'test', 'info', 'invalid']);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });
});
