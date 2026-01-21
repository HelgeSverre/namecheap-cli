import { describe, expect, test, beforeEach, afterEach, mock, spyOn, type Mock } from 'bun:test';
import { Command } from 'commander';
import { listCommand } from '../../src/commands/whoisguard/list.js';
import { enableCommand } from '../../src/commands/whoisguard/enable.js';
import { disableCommand } from '../../src/commands/whoisguard/disable.js';
import { allotCommand } from '../../src/commands/whoisguard/allot.js';
import { unallotCommand } from '../../src/commands/whoisguard/unallot.js';
import { renewCommand } from '../../src/commands/whoisguard/renew.js';
import * as client from '../../src/lib/api/client.js';
import * as whoisguardApi from '../../src/lib/api/whoisguard.js';
import * as spinner from '../../src/utils/spinner.js';
import * as inquirerInput from '@inquirer/prompts';

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

// Sample WhoisGuard items
const sampleWhoisGuardList: whoisguardApi.WhoisGuardListResult = {
  items: [
    {
      id: '12345',
      domainName: 'example.com',
      enabled: true,
      expireDate: '2025-12-31',
      status: 'ACTIVE',
      emailHash: 'abc123',
    },
    {
      id: '67890',
      domainName: '',
      enabled: false,
      expireDate: '2024-06-30',
      status: 'EXPIRED',
      emailHash: '',
    },
  ],
  totalItems: 2,
  currentPage: 1,
  pageSize: 20,
};

const sampleWhoisGuardItem: whoisguardApi.WhoisGuardItem = {
  id: '12345',
  domainName: 'example.com',
  enabled: false,
  expireDate: '2025-12-31',
  status: 'ACTIVE',
  emailHash: 'abc123',
};

const enabledWhoisGuardItem: whoisguardApi.WhoisGuardItem = {
  id: '12345',
  domainName: 'example.com',
  enabled: true,
  expireDate: '2025-12-31',
  status: 'ACTIVE',
  emailHash: 'abc123',
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

describe('whoisguard list command', () => {
  test('displays WhoisGuard subscriptions', async () => {
    trackSpy(spyOn(whoisguardApi, 'getWhoisGuardList').mockResolvedValue(sampleWhoisGuardList));

    const program = new Command();
    program.addCommand(listCommand);
    await program.parseAsync(['node', 'test', 'list']);

    expect(logs.some((l) => l.includes('12345'))).toBe(true);
    expect(logs.some((l) => l.includes('example.com'))).toBe(true);
    expect(logs.some((l) => l.includes('Total: 2 subscription(s)'))).toBe(true);
  });

  test('shows unassigned for domains with no domain name', async () => {
    trackSpy(spyOn(whoisguardApi, 'getWhoisGuardList').mockResolvedValue(sampleWhoisGuardList));

    const program = new Command();
    program.addCommand(listCommand);
    await program.parseAsync(['node', 'test', 'list']);

    expect(logs.some((l) => l.includes('(unassigned)'))).toBe(true);
  });

  test('shows message when no subscriptions found', async () => {
    trackSpy(
      spyOn(whoisguardApi, 'getWhoisGuardList').mockResolvedValue({
        items: [],
        totalItems: 0,
        currentPage: 1,
        pageSize: 20,
      }),
    );

    const program = new Command();
    program.addCommand(listCommand);
    await program.parseAsync(['node', 'test', 'list']);

    expect(logs.some((l) => l.includes('No WhoisGuard subscriptions found'))).toBe(true);
  });

  test('outputs JSON with --json flag', async () => {
    trackSpy(spyOn(whoisguardApi, 'getWhoisGuardList').mockResolvedValue(sampleWhoisGuardList));

    const program = new Command();
    program.addCommand(listCommand);
    await program.parseAsync(['node', 'test', 'list', '--json']);

    const jsonOutput = logs.find((l) => l.includes('domainName'));
    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput!);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].id).toBe('12345');
  });

  test('supports pagination options', async () => {
    const getListSpy = trackSpy(
      spyOn(whoisguardApi, 'getWhoisGuardList').mockResolvedValue(sampleWhoisGuardList),
    );

    const program = new Command();
    program.addCommand(listCommand);
    await program.parseAsync(['node', 'test', 'list', '--page', '2', '--page-size', '50']);

    expect(getListSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ page: 2, pageSize: 50 }),
    );
  });

  test('handles API error', async () => {
    trackSpy(
      spyOn(whoisguardApi, 'getWhoisGuardList').mockRejectedValue(
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

describe('whoisguard enable command', () => {
  test('enables WhoisGuard for a domain', async () => {
    trackSpy(
      spyOn(whoisguardApi, 'findWhoisGuardByDomain').mockResolvedValue(sampleWhoisGuardItem),
    );
    trackSpy(spyOn(whoisguardApi, 'enableWhoisGuard').mockResolvedValue(true));
    trackSpy(spyOn(inquirerInput, 'input').mockResolvedValue('user@example.com'));

    const program = new Command();
    program.addCommand(enableCommand);
    await program.parseAsync(['node', 'test', 'enable', 'example.com']);

    expect(logs.some((l) => l.includes('WhoisGuard enabled'))).toBe(true);
  });

  test('uses --email option if provided', async () => {
    trackSpy(
      spyOn(whoisguardApi, 'findWhoisGuardByDomain').mockResolvedValue(sampleWhoisGuardItem),
    );
    const enableSpy = trackSpy(spyOn(whoisguardApi, 'enableWhoisGuard').mockResolvedValue(true));

    const program = new Command();
    program.addCommand(enableCommand);
    await program.parseAsync(['node', 'test', 'enable', 'example.com', '--email', 'test@test.com']);

    expect(enableSpy).toHaveBeenCalledWith(expect.anything(), '12345', 'test@test.com');
  });

  test('shows message when already enabled', async () => {
    trackSpy(
      spyOn(whoisguardApi, 'findWhoisGuardByDomain').mockResolvedValue(enabledWhoisGuardItem),
    );

    const program = new Command();
    program.addCommand(enableCommand);
    await program.parseAsync(['node', 'test', 'enable', 'example.com', '--email', 'test@test.com']);

    expect(logs.some((l) => l.includes('already enabled'))).toBe(true);
  });

  test('throws error when no WhoisGuard found', async () => {
    trackSpy(spyOn(whoisguardApi, 'findWhoisGuardByDomain').mockResolvedValue(null));

    const program = new Command();
    program.addCommand(enableCommand);

    try {
      await program.parseAsync([
        'node',
        'test',
        'enable',
        'example.com',
        '--email',
        'test@test.com',
      ]);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
    expect(errors.some((l) => l.includes('No WhoisGuard found'))).toBe(true);
  });

  test('validates email address', async () => {
    trackSpy(
      spyOn(whoisguardApi, 'findWhoisGuardByDomain').mockResolvedValue(sampleWhoisGuardItem),
    );
    trackSpy(spyOn(inquirerInput, 'input').mockResolvedValue('invalid-email'));

    const program = new Command();
    program.addCommand(enableCommand);

    try {
      await program.parseAsync(['node', 'test', 'enable', 'example.com']);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });

  test('outputs JSON with --json flag', async () => {
    trackSpy(
      spyOn(whoisguardApi, 'findWhoisGuardByDomain').mockResolvedValue(sampleWhoisGuardItem),
    );
    trackSpy(spyOn(whoisguardApi, 'enableWhoisGuard').mockResolvedValue(true));

    const program = new Command();
    program.addCommand(enableCommand);
    await program.parseAsync([
      'node',
      'test',
      'enable',
      'example.com',
      '--email',
      'test@test.com',
      '--json',
    ]);

    const jsonOutput = logs.find((l) => l.includes('enabled'));
    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput!);
    expect(parsed.enabled).toBe(true);
    expect(parsed.domain).toBe('example.com');
  });

  test('validates domain', async () => {
    const program = new Command();
    program.addCommand(enableCommand);

    try {
      await program.parseAsync(['node', 'test', 'enable', 'invalid']);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });
});

describe('whoisguard disable command', () => {
  test('disables WhoisGuard for a domain with confirmation', async () => {
    trackSpy(
      spyOn(whoisguardApi, 'findWhoisGuardByDomain').mockResolvedValue(enabledWhoisGuardItem),
    );
    trackSpy(spyOn(whoisguardApi, 'disableWhoisGuard').mockResolvedValue(true));
    trackSpy(spyOn(inquirerInput, 'confirm').mockResolvedValue(true));

    const program = new Command();
    program.addCommand(disableCommand);
    await program.parseAsync(['node', 'test', 'disable', 'example.com']);

    expect(logs.some((l) => l.includes('WhoisGuard disabled'))).toBe(true);
  });

  test('skips confirmation with -y flag', async () => {
    trackSpy(
      spyOn(whoisguardApi, 'findWhoisGuardByDomain').mockResolvedValue(enabledWhoisGuardItem),
    );
    const disableSpy = trackSpy(spyOn(whoisguardApi, 'disableWhoisGuard').mockResolvedValue(true));

    const program = new Command();
    program.addCommand(disableCommand);
    await program.parseAsync(['node', 'test', 'disable', 'example.com', '-y']);

    expect(disableSpy).toHaveBeenCalled();
    expect(logs.some((l) => l.includes('WhoisGuard disabled'))).toBe(true);
  });

  test('shows message when already disabled', async () => {
    trackSpy(
      spyOn(whoisguardApi, 'findWhoisGuardByDomain').mockResolvedValue(sampleWhoisGuardItem),
    );

    const program = new Command();
    program.addCommand(disableCommand);
    await program.parseAsync(['node', 'test', 'disable', 'example.com', '-y']);

    expect(logs.some((l) => l.includes('already disabled'))).toBe(true);
  });

  test('cancels when user declines confirmation', async () => {
    trackSpy(
      spyOn(whoisguardApi, 'findWhoisGuardByDomain').mockResolvedValue(enabledWhoisGuardItem),
    );
    trackSpy(spyOn(inquirerInput, 'confirm').mockResolvedValue(false));

    const program = new Command();
    program.addCommand(disableCommand);
    await program.parseAsync(['node', 'test', 'disable', 'example.com']);

    expect(logs.some((l) => l.includes('Cancelled'))).toBe(true);
  });

  test('throws error when no WhoisGuard found', async () => {
    trackSpy(spyOn(whoisguardApi, 'findWhoisGuardByDomain').mockResolvedValue(null));

    const program = new Command();
    program.addCommand(disableCommand);

    try {
      await program.parseAsync(['node', 'test', 'disable', 'example.com', '-y']);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });

  test('outputs JSON with --json flag', async () => {
    trackSpy(
      spyOn(whoisguardApi, 'findWhoisGuardByDomain').mockResolvedValue(enabledWhoisGuardItem),
    );
    trackSpy(spyOn(whoisguardApi, 'disableWhoisGuard').mockResolvedValue(true));

    const program = new Command();
    program.addCommand(disableCommand);
    await program.parseAsync(['node', 'test', 'disable', 'example.com', '-y', '--json']);

    const jsonOutput = logs.find((l) => l.includes('disabled'));
    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput!);
    expect(parsed.disabled).toBe(true);
  });
});

describe('whoisguard allot command', () => {
  test('assigns WhoisGuard to a domain', async () => {
    trackSpy(spyOn(whoisguardApi, 'allotWhoisGuard').mockResolvedValue(true));

    const program = new Command();
    program.addCommand(allotCommand);
    await program.parseAsync(['node', 'test', 'allot', '12345', 'example.com']);

    expect(logs.some((l) => l.includes('WhoisGuard 12345 assigned to example.com'))).toBe(true);
  });

  test('outputs JSON with --json flag', async () => {
    trackSpy(spyOn(whoisguardApi, 'allotWhoisGuard').mockResolvedValue(true));

    const program = new Command();
    program.addCommand(allotCommand);
    await program.parseAsync(['node', 'test', 'allot', '12345', 'example.com', '--json']);

    const jsonOutput = logs.find((l) => l.includes('allotted'));
    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput!);
    expect(parsed.allotted).toBe(true);
    expect(parsed.whoisguardId).toBe('12345');
    expect(parsed.domain).toBe('example.com');
  });

  test('validates domain', async () => {
    const program = new Command();
    program.addCommand(allotCommand);

    try {
      await program.parseAsync(['node', 'test', 'allot', '12345', 'invalid']);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });

  test('handles API error', async () => {
    trackSpy(spyOn(whoisguardApi, 'allotWhoisGuard').mockRejectedValue(new Error('API Error')));

    const program = new Command();
    program.addCommand(allotCommand);

    try {
      await program.parseAsync(['node', 'test', 'allot', '12345', 'example.com']);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });
});

describe('whoisguard unallot command', () => {
  test('removes WhoisGuard from domain with confirmation', async () => {
    trackSpy(spyOn(whoisguardApi, 'unallotWhoisGuard').mockResolvedValue(true));
    trackSpy(spyOn(inquirerInput, 'confirm').mockResolvedValue(true));

    const program = new Command();
    program.addCommand(unallotCommand);
    await program.parseAsync(['node', 'test', 'unallot', '12345']);

    expect(logs.some((l) => l.includes('WhoisGuard 12345 removed from domain'))).toBe(true);
  });

  test('skips confirmation with -y flag', async () => {
    const unallotSpy = trackSpy(spyOn(whoisguardApi, 'unallotWhoisGuard').mockResolvedValue(true));

    const program = new Command();
    program.addCommand(unallotCommand);
    await program.parseAsync(['node', 'test', 'unallot', '12345', '-y']);

    expect(unallotSpy).toHaveBeenCalledWith(expect.anything(), '12345');
  });

  test('cancels when user declines confirmation', async () => {
    trackSpy(spyOn(inquirerInput, 'confirm').mockResolvedValue(false));

    const program = new Command();
    program.addCommand(unallotCommand);
    await program.parseAsync(['node', 'test', 'unallot', '12345']);

    expect(logs.some((l) => l.includes('Cancelled'))).toBe(true);
  });

  test('outputs JSON with --json flag', async () => {
    trackSpy(spyOn(whoisguardApi, 'unallotWhoisGuard').mockResolvedValue(true));

    const program = new Command();
    program.addCommand(unallotCommand);
    await program.parseAsync(['node', 'test', 'unallot', '12345', '-y', '--json']);

    const jsonOutput = logs.find((l) => l.includes('unallotted'));
    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput!);
    expect(parsed.unallotted).toBe(true);
    expect(parsed.whoisguardId).toBe('12345');
  });

  test('handles API error', async () => {
    trackSpy(spyOn(whoisguardApi, 'unallotWhoisGuard').mockRejectedValue(new Error('API Error')));

    const program = new Command();
    program.addCommand(unallotCommand);

    try {
      await program.parseAsync(['node', 'test', 'unallot', '12345', '-y']);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });
});

describe('whoisguard renew command', () => {
  const renewalResult: whoisguardApi.WhoisGuardRenewalResult = {
    whoisguardId: '12345',
    years: 1,
    renewed: true,
    chargedAmount: 4.88,
    orderId: 123456,
    transactionId: 789012,
  };

  test('renews WhoisGuard with confirmation', async () => {
    trackSpy(spyOn(whoisguardApi, 'renewWhoisGuard').mockResolvedValue(renewalResult));
    trackSpy(spyOn(inquirerInput, 'confirm').mockResolvedValue(true));

    const program = new Command();
    program.addCommand(renewCommand);
    await program.parseAsync(['node', 'test', 'renew', '12345']);

    expect(logs.some((l) => l.includes('renewed successfully'))).toBe(true);
    expect(logs.some((l) => l.includes('Order ID: 123456'))).toBe(true);
    expect(logs.some((l) => l.includes('$4.88'))).toBe(true);
  });

  test('skips confirmation with -y flag', async () => {
    const renewSpy = trackSpy(
      spyOn(whoisguardApi, 'renewWhoisGuard').mockResolvedValue(renewalResult),
    );

    const program = new Command();
    program.addCommand(renewCommand);
    await program.parseAsync(['node', 'test', 'renew', '12345', '-y']);

    expect(renewSpy).toHaveBeenCalledWith(expect.anything(), '12345', 1, undefined);
  });

  test('supports --years option', async () => {
    const renewSpy = trackSpy(
      spyOn(whoisguardApi, 'renewWhoisGuard').mockResolvedValue({
        ...renewalResult,
        years: 3,
        chargedAmount: 14.64,
      }),
    );

    const program = new Command();
    program.addCommand(renewCommand);
    await program.parseAsync(['node', 'test', 'renew', '12345', '--years', '3', '-y']);

    expect(renewSpy).toHaveBeenCalledWith(expect.anything(), '12345', 3, undefined);
  });

  test('supports --promo-code option', async () => {
    const renewSpy = trackSpy(
      spyOn(whoisguardApi, 'renewWhoisGuard').mockResolvedValue(renewalResult),
    );

    const program = new Command();
    program.addCommand(renewCommand);
    await program.parseAsync(['node', 'test', 'renew', '12345', '--promo-code', 'SAVE20', '-y']);

    expect(renewSpy).toHaveBeenCalledWith(expect.anything(), '12345', 1, 'SAVE20');
  });

  test('validates years range', async () => {
    const program = new Command();
    program.addCommand(renewCommand);

    try {
      await program.parseAsync(['node', 'test', 'renew', '12345', '--years', '15', '-y']);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
    expect(errors.some((l) => l.includes('Years must be between 1 and 10'))).toBe(true);
  });

  test('cancels when user declines confirmation', async () => {
    trackSpy(spyOn(inquirerInput, 'confirm').mockResolvedValue(false));

    const program = new Command();
    program.addCommand(renewCommand);
    await program.parseAsync(['node', 'test', 'renew', '12345']);

    expect(logs.some((l) => l.includes('Renewal cancelled'))).toBe(true);
  });

  test('outputs JSON with --json flag', async () => {
    trackSpy(spyOn(whoisguardApi, 'renewWhoisGuard').mockResolvedValue(renewalResult));

    const program = new Command();
    program.addCommand(renewCommand);
    await program.parseAsync(['node', 'test', 'renew', '12345', '-y', '--json']);

    const jsonOutput = logs.find((l) => l.includes('whoisguardId'));
    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput!);
    expect(parsed.renewed).toBe(true);
    expect(parsed.chargedAmount).toBe(4.88);
    expect(parsed.orderId).toBe(123456);
  });

  test('handles API error', async () => {
    trackSpy(spyOn(whoisguardApi, 'renewWhoisGuard').mockRejectedValue(new Error('API Error')));

    const program = new Command();
    program.addCommand(renewCommand);

    try {
      await program.parseAsync(['node', 'test', 'renew', '12345', '-y']);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });
});
