import { describe, expect, test, beforeEach, afterEach, mock, spyOn, type Mock } from 'bun:test';
import { Command } from 'commander';
import { listCommand } from '../../src/commands/domains/list.js';
import { infoCommand } from '../../src/commands/domains/info.js';
import { checkCommand } from '../../src/commands/domains/check.js';
import { lockCommand, unlockCommand } from '../../src/commands/domains/lock.js';
import { renewCommand } from '../../src/commands/domains/renew.js';
import { reactivateCommand } from '../../src/commands/domains/reactivate.js';
import { contactsCommand } from '../../src/commands/domains/contacts.js';
import { registerCommand } from '../../src/commands/domains/register.js';
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

describe('domains lock command', () => {
  test('locks an unlocked domain', async () => {
    trackSpy(spyOn(domainsApi, 'getRegistrarLock').mockResolvedValue(false));
    const setLockSpy = trackSpy(spyOn(domainsApi, 'setRegistrarLock').mockResolvedValue(true));

    const program = new Command();
    program.addCommand(lockCommand);
    await program.parseAsync(['node', 'test', 'lock', 'example.com']);

    expect(setLockSpy).toHaveBeenCalledWith(expect.anything(), 'example.com', true);
    expect(logs.some((l) => l.includes('Successfully locked example.com'))).toBe(true);
  });

  test('shows info when domain already locked', async () => {
    trackSpy(spyOn(domainsApi, 'getRegistrarLock').mockResolvedValue(true));
    const setLockSpy = trackSpy(spyOn(domainsApi, 'setRegistrarLock').mockResolvedValue(true));

    const program = new Command();
    program.addCommand(lockCommand);
    await program.parseAsync(['node', 'test', 'lock', 'example.com']);

    expect(setLockSpy).not.toHaveBeenCalled();
    expect(logs.some((l) => l.includes('already locked'))).toBe(true);
  });

  test('validates domain argument', async () => {
    const program = new Command();
    program.addCommand(lockCommand);

    try {
      await program.parseAsync(['node', 'test', 'lock', 'invalid']);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });
});

describe('domains unlock command', () => {
  test('unlocks a locked domain', async () => {
    trackSpy(spyOn(domainsApi, 'getRegistrarLock').mockResolvedValue(true));
    const setLockSpy = trackSpy(spyOn(domainsApi, 'setRegistrarLock').mockResolvedValue(true));

    const program = new Command();
    program.addCommand(unlockCommand);
    await program.parseAsync(['node', 'test', 'unlock', 'example.com']);

    expect(setLockSpy).toHaveBeenCalledWith(expect.anything(), 'example.com', false);
    expect(logs.some((l) => l.includes('Successfully unlocked example.com'))).toBe(true);
  });

  test('shows info when domain already unlocked', async () => {
    trackSpy(spyOn(domainsApi, 'getRegistrarLock').mockResolvedValue(false));
    const setLockSpy = trackSpy(spyOn(domainsApi, 'setRegistrarLock').mockResolvedValue(true));

    const program = new Command();
    program.addCommand(unlockCommand);
    await program.parseAsync(['node', 'test', 'unlock', 'example.com']);

    expect(setLockSpy).not.toHaveBeenCalled();
    expect(logs.some((l) => l.includes('already unlocked'))).toBe(true);
  });
});

describe('domains renew command', () => {
  const mockDomainInfo = {
    domainName: 'example.com',
    ownerName: 'John Doe',
    status: 'active',
    isOwner: true,
    createdDate: '2020-01-01',
    expiredDate: '2025-12-31',
    modifyDate: '2024-01-01',
    isPremium: false,
    dnsProviderType: 'Namecheap BasicDNS',
    whoisGuard: { id: '456', enabled: true, expiredDate: '2025-12-31' },
  };

  const mockRenewResult = {
    domainName: 'example.com',
    domainId: 1,
    charged: true,
    chargedAmount: 10.87,
    orderId: 12345,
    transactionId: 67890,
    expireDate: '2026-12-31',
  };

  test('renews domain with default 1 year', async () => {
    trackSpy(spyOn(domainsApi, 'getDomainInfo').mockResolvedValue(mockDomainInfo));
    const renewSpy = trackSpy(spyOn(domainsApi, 'renewDomain').mockResolvedValue(mockRenewResult));

    const program = new Command();
    program.addCommand(renewCommand);
    await program.parseAsync(['node', 'test', 'renew', 'example.com', '--yes']);

    expect(renewSpy).toHaveBeenCalledWith(expect.anything(), 'example.com', 1, undefined);
    expect(logs.some((l) => l.includes('renewed successfully'))).toBe(true);
    expect(logs.some((l) => l.includes('12345'))).toBe(true);
  });

  test('renews domain with custom years', async () => {
    trackSpy(spyOn(domainsApi, 'getDomainInfo').mockResolvedValue(mockDomainInfo));
    const renewSpy = trackSpy(spyOn(domainsApi, 'renewDomain').mockResolvedValue(mockRenewResult));

    const program = new Command();
    program.addCommand(renewCommand);
    await program.parseAsync(['node', 'test', 'renew', 'example.com', '--years', '3', '--yes']);

    expect(renewSpy).toHaveBeenCalledWith(expect.anything(), 'example.com', 3, undefined);
  });

  test('validates years range', async () => {
    const program = new Command();
    program.addCommand(renewCommand);

    try {
      await program.parseAsync(['node', 'test', 'renew', 'example.com', '--years', '0', '--yes']);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });

  test('outputs JSON with --json flag', async () => {
    trackSpy(spyOn(domainsApi, 'getDomainInfo').mockResolvedValue(mockDomainInfo));
    trackSpy(spyOn(domainsApi, 'renewDomain').mockResolvedValue(mockRenewResult));

    const program = new Command();
    program.addCommand(renewCommand);
    await program.parseAsync(['node', 'test', 'renew', 'example.com', '--json', '--yes']);

    const jsonOutput = logs.find((l) => l.includes('orderId'));
    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput!);
    expect(parsed.orderId).toBe(12345);
  });

  test('validates domain argument', async () => {
    const program = new Command();
    program.addCommand(renewCommand);

    try {
      await program.parseAsync(['node', 'test', 'renew', 'invalid']);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });
});

describe('domains reactivate command', () => {
  const mockReactivateResult = {
    domainName: 'example.com',
    domainId: 0,
    charged: true,
    chargedAmount: 12.98,
    orderId: 54321,
    transactionId: 98765,
    expireDate: '',
  };

  test('reactivates domain successfully', async () => {
    const reactivateSpy = trackSpy(
      spyOn(domainsApi, 'reactivateDomain').mockResolvedValue(mockReactivateResult),
    );

    const program = new Command();
    program.addCommand(reactivateCommand);
    await program.parseAsync(['node', 'test', 'reactivate', 'example.com', '--yes']);

    expect(reactivateSpy).toHaveBeenCalledWith(expect.anything(), 'example.com', 1, undefined);
    expect(logs.some((l) => l.includes('reactivated successfully'))).toBe(true);
    expect(logs.some((l) => l.includes('54321'))).toBe(true);
  });

  test('shows initiated message when not charged', async () => {
    trackSpy(
      spyOn(domainsApi, 'reactivateDomain').mockResolvedValue({
        ...mockReactivateResult,
        charged: false,
      }),
    );

    const program = new Command();
    program.addCommand(reactivateCommand);
    await program.parseAsync(['node', 'test', 'reactivate', 'example.com', '--yes']);

    expect(logs.some((l) => l.includes('reactivation initiated'))).toBe(true);
  });

  test('validates years range', async () => {
    const program = new Command();
    program.addCommand(reactivateCommand);

    try {
      await program.parseAsync([
        'node',
        'test',
        'reactivate',
        'example.com',
        '--years',
        '11',
        '--yes',
      ]);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });

  test('outputs JSON with --json flag', async () => {
    trackSpy(spyOn(domainsApi, 'reactivateDomain').mockResolvedValue(mockReactivateResult));

    const program = new Command();
    program.addCommand(reactivateCommand);
    await program.parseAsync(['node', 'test', 'reactivate', 'example.com', '--json', '--yes']);

    const jsonOutput = logs.find((l) => l.includes('orderId'));
    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput!);
    expect(parsed.orderId).toBe(54321);
  });

  test('validates domain argument', async () => {
    const program = new Command();
    program.addCommand(reactivateCommand);

    try {
      await program.parseAsync(['node', 'test', 'reactivate', 'invalid']);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });
});

const sampleContact = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '+1.5551234567',
  address1: '123 Main St',
  city: 'New York',
  stateProvince: 'NY',
  postalCode: '10001',
  country: 'US',
};

const sampleContacts = {
  registrant: sampleContact,
  tech: sampleContact,
  admin: sampleContact,
  auxBilling: sampleContact,
};

describe('domains contacts command', () => {
  test('gets all contacts', async () => {
    trackSpy(spyOn(domainsApi, 'getContacts').mockResolvedValue(sampleContacts));

    const program = new Command();
    program.addCommand(contactsCommand);
    await program.parseAsync(['node', 'test', 'contacts', 'example.com']);

    expect(logs.some((l) => l.includes('John'))).toBe(true);
    expect(logs.some((l) => l.includes('Doe'))).toBe(true);
    expect(logs.some((l) => l.includes('Registrant'))).toBe(true);
    expect(logs.some((l) => l.includes('Tech'))).toBe(true);
    expect(logs.some((l) => l.includes('Admin'))).toBe(true);
    expect(logs.some((l) => l.includes('AuxBilling'))).toBe(true);
  });

  test('gets specific contact type with --type', async () => {
    trackSpy(spyOn(domainsApi, 'getContacts').mockResolvedValue(sampleContacts));

    const program = new Command();
    program.addCommand(contactsCommand);
    await program.parseAsync(['node', 'test', 'contacts', 'example.com', '--type', 'registrant']);

    expect(logs.some((l) => l.includes('Registrant'))).toBe(true);
    expect(logs.some((l) => l.includes('John'))).toBe(true);
    expect(logs.some((l) => l.includes('Tech'))).toBe(false);
    expect(logs.some((l) => l.includes('Admin'))).toBe(false);
  });

  test('outputs JSON with --json flag', async () => {
    trackSpy(spyOn(domainsApi, 'getContacts').mockResolvedValue(sampleContacts));

    const program = new Command();
    program.addCommand(contactsCommand);
    await program.parseAsync(['node', 'test', 'contacts', 'example.com', '--json']);

    const jsonOutput = logs.find((l) => l.includes('registrant'));
    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput!);
    expect(parsed.registrant.firstName).toBe('John');
  });

  test('outputs specific contact type as JSON', async () => {
    trackSpy(spyOn(domainsApi, 'getContacts').mockResolvedValue(sampleContacts));

    const program = new Command();
    program.addCommand(contactsCommand);
    await program.parseAsync([
      'node',
      'test',
      'contacts',
      'example.com',
      '--type',
      'registrant',
      '--json',
    ]);

    const jsonOutput = logs.find((l) => l.includes('firstName'));
    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput!);
    expect(parsed.firstName).toBe('John');
  });

  test('validates domain argument', async () => {
    const program = new Command();
    program.addCommand(contactsCommand);

    try {
      await program.parseAsync(['node', 'test', 'contacts', 'invalid']);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });

  test('errors on invalid action', async () => {
    const program = new Command();
    program.addCommand(contactsCommand);

    try {
      await program.parseAsync(['node', 'test', 'contacts', 'example.com', 'invalid']);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });
});

describe('domains register command', () => {
  test('shows unavailable message when domain taken', async () => {
    trackSpy(
      spyOn(domainsApi, 'checkDomainAvailability').mockResolvedValue([
        { domain: 'taken.com', available: false, premium: false },
      ]),
    );

    const program = new Command();
    program.addCommand(registerCommand);

    try {
      await program.parseAsync(['node', 'test', 'register', 'taken.com']);
    } catch (_e) {
      // Expected
    }

    expect(logs.some((l) => l.includes('not available'))).toBe(true);
    expect(exitCode).toBe(1);
  });

  test('dry run shows availability without registering', async () => {
    trackSpy(
      spyOn(domainsApi, 'checkDomainAvailability').mockResolvedValue([
        { domain: 'available.com', available: true, premium: false },
      ]),
    );
    const registerSpy = trackSpy(
      spyOn(domainsApi, 'registerDomain').mockResolvedValue({
        domain: 'available.com',
        registered: true,
        chargedAmount: 10.0,
        domainId: 1,
        orderId: 1,
        transactionId: 1,
        whoisguardEnabled: true,
        nonRealTimeDomain: false,
      }),
    );

    const program = new Command();
    program.addCommand(registerCommand);
    await program.parseAsync(['node', 'test', 'register', 'available.com', '--dry-run']);

    expect(logs.some((l) => l.includes('available'))).toBe(true);
    expect(logs.some((l) => l.includes('Dry run'))).toBe(true);
    expect(registerSpy).not.toHaveBeenCalled();
  });

  test('validates years range', async () => {
    const program = new Command();
    program.addCommand(registerCommand);

    try {
      await program.parseAsync(['node', 'test', 'register', 'example.com', '--years', '0']);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });

  test('requires contact info with --yes flag', async () => {
    trackSpy(
      spyOn(domainsApi, 'checkDomainAvailability').mockResolvedValue([
        { domain: 'available.com', available: true, premium: false },
      ]),
    );

    const program = new Command();
    program.addCommand(registerCommand);

    try {
      await program.parseAsync(['node', 'test', 'register', 'available.com', '--yes']);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });

  test('validates domain argument', async () => {
    const program = new Command();
    program.addCommand(registerCommand);

    try {
      await program.parseAsync(['node', 'test', 'register', 'invalid']);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });
});

describe('domains check command', () => {
  test('checks single domain availability', async () => {
    trackSpy(
      spyOn(domainsApi, 'checkDomainAvailability').mockResolvedValue([
        { domain: 'example.com', available: true, premium: false },
      ]),
    );

    const program = new Command();
    program.addCommand(checkCommand);
    await program.parseAsync(['node', 'test', 'check', 'example.com']);

    expect(logs.some((l) => l.includes('example.com'))).toBe(true);
    expect(logs.some((l) => l.includes('Available'))).toBe(true);
  });

  test('checks multiple domains', async () => {
    trackSpy(
      spyOn(domainsApi, 'checkDomainAvailability').mockResolvedValue([
        { domain: 'example.com', available: true, premium: false },
        { domain: 'test.net', available: false, premium: false },
      ]),
    );

    const program = new Command();
    program.addCommand(checkCommand);
    await program.parseAsync(['node', 'test', 'check', 'example.com', 'test.net']);

    expect(logs.some((l) => l.includes('example.com'))).toBe(true);
    expect(logs.some((l) => l.includes('test.net'))).toBe(true);
  });

  test('shows premium domain info', async () => {
    trackSpy(
      spyOn(domainsApi, 'checkDomainAvailability').mockResolvedValue([
        { domain: 'premium.com', available: true, premium: true, premiumPrice: 999 },
      ]),
    );

    const program = new Command();
    program.addCommand(checkCommand);
    await program.parseAsync(['node', 'test', 'check', 'premium.com']);

    expect(logs.some((l) => l.includes('premium.com'))).toBe(true);
    expect(logs.some((l) => l.includes('Yes'))).toBe(true);
    expect(logs.some((l) => l.includes('$999'))).toBe(true);
  });

  test('outputs JSON with --json flag', async () => {
    trackSpy(
      spyOn(domainsApi, 'checkDomainAvailability').mockResolvedValue([
        { domain: 'example.com', available: true, premium: false },
      ]),
    );

    const program = new Command();
    program.addCommand(checkCommand);
    await program.parseAsync(['node', 'test', 'check', 'example.com', '--json']);

    const jsonOutput = logs.find((l) => l.includes('domain'));
    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput!);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].domain).toBe('example.com');
  });

  test('validates domain arguments', async () => {
    const program = new Command();
    program.addCommand(checkCommand);

    try {
      await program.parseAsync(['node', 'test', 'check', 'invalid']);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });
});
