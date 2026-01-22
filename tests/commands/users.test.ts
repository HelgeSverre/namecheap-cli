import { describe, expect, test, beforeEach, afterEach, mock, spyOn, type Mock } from 'bun:test';
import { Command } from 'commander';
import { addFundsCommand } from '../../src/commands/users/add-funds.js';
import { balancesCommand } from '../../src/commands/users/balances.js';
import { changePasswordCommand } from '../../src/commands/users/change-password.js';
import { createCommand } from '../../src/commands/users/create.js';
import { fundsStatusCommand } from '../../src/commands/users/funds-status.js';
import { loginCommand } from '../../src/commands/users/login.js';
import { pricingCommand } from '../../src/commands/users/pricing.js';
import { resetPasswordCommand } from '../../src/commands/users/reset-password.js';
import { updateCommand } from '../../src/commands/users/update.js';
import * as client from '../../src/lib/api/client.js';
import * as config from '../../src/lib/config.js';
import * as usersApi from '../../src/lib/api/users.js';
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

describe('users balances command', () => {
  test('displays account balances', async () => {
    trackSpy(
      spyOn(usersApi, 'getBalances').mockResolvedValue({
        currency: 'USD',
        availableBalance: 150.5,
        accountBalance: 200.0,
        earnedAmount: 25.0,
        withdrawableAmount: 0,
        pendingAmount: 10.0,
      }),
    );

    const program = new Command();
    program.addCommand(balancesCommand);
    await program.parseAsync(['node', 'test', 'balances']);

    expect(logs.some((l) => l.includes('Available Balance'))).toBe(true);
    expect(logs.some((l) => l.includes('$150.50'))).toBe(true);
    expect(logs.some((l) => l.includes('Account Balance'))).toBe(true);
    expect(logs.some((l) => l.includes('$200.00'))).toBe(true);
  });

  test('outputs JSON with --json flag', async () => {
    trackSpy(
      spyOn(usersApi, 'getBalances').mockResolvedValue({
        currency: 'USD',
        availableBalance: 150.5,
        accountBalance: 200.0,
        earnedAmount: 25.0,
        withdrawableAmount: 0,
        pendingAmount: 10.0,
      }),
    );

    const program = new Command();
    program.addCommand(balancesCommand);
    await program.parseAsync(['node', 'test', 'balances', '--json']);

    const jsonOutput = logs.find((l) => l.includes('availableBalance'));
    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput!);
    expect(parsed.availableBalance).toBe(150.5);
    expect(parsed.currency).toBe('USD');
  });

  test('handles API error', async () => {
    trackSpy(
      spyOn(usersApi, 'getBalances').mockRejectedValue(
        new Error('API Error: Authentication failed'),
      ),
    );

    const program = new Command();
    program.addCommand(balancesCommand);

    try {
      await program.parseAsync(['node', 'test', 'balances']);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });
});

describe('users pricing command', () => {
  test('displays pricing for register action', async () => {
    trackSpy(
      spyOn(usersApi, 'getPricing').mockResolvedValue([
        {
          productType: 'DOMAIN',
          productCategory: 'DOMAINS',
          productName: 'com',
          price: 8.88,
          additionalCost: 0.18,
          regularPrice: 10.98,
          yourPrice: 8.88,
          yourPriceType: 'CUSTOMER',
          currency: 'USD',
          duration: 1,
        },
        {
          productType: 'DOMAIN',
          productCategory: 'DOMAINS',
          productName: 'net',
          price: 9.98,
          additionalCost: 0.18,
          regularPrice: 12.98,
          yourPrice: 9.98,
          yourPriceType: 'CUSTOMER',
          currency: 'USD',
          duration: 1,
        },
      ]),
    );

    const program = new Command();
    program.addCommand(pricingCommand);
    await program.parseAsync(['node', 'test', 'pricing', 'register']);

    expect(logs.some((l) => l.includes('com'))).toBe(true);
    expect(logs.some((l) => l.includes('net'))).toBe(true);
    expect(logs.some((l) => l.includes('$8.88'))).toBe(true);
  });

  test('displays pricing for specific TLD', async () => {
    const getPricingSpy = trackSpy(
      spyOn(usersApi, 'getPricing').mockResolvedValue([
        {
          productType: 'DOMAIN',
          productCategory: 'DOMAINS',
          productName: 'io',
          price: 32.88,
          additionalCost: 0.18,
          regularPrice: 39.98,
          yourPrice: 32.88,
          yourPriceType: 'CUSTOMER',
          currency: 'USD',
          duration: 1,
        },
      ]),
    );

    const program = new Command();
    program.addCommand(pricingCommand);
    await program.parseAsync(['node', 'test', 'pricing', 'register', 'io']);

    expect(getPricingSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ tld: 'io' }),
    );
    expect(logs.some((l) => l.includes('io'))).toBe(true);
  });

  test('supports different actions', async () => {
    const getPricingSpy = trackSpy(spyOn(usersApi, 'getPricing').mockResolvedValue([]));

    const program = new Command();
    program.addCommand(pricingCommand);
    await program.parseAsync(['node', 'test', 'pricing', 'renew', 'com']);

    expect(getPricingSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ action: 'renew' }),
    );
  });

  test('validates action argument', async () => {
    const program = new Command();
    program.addCommand(pricingCommand);

    try {
      await program.parseAsync(['node', 'test', 'pricing', 'invalid']);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });

  test('validates years option', async () => {
    const program = new Command();
    program.addCommand(pricingCommand);

    try {
      await program.parseAsync(['node', 'test', 'pricing', 'register', '--years', '15']);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });

  test('shows message when no pricing found', async () => {
    trackSpy(spyOn(usersApi, 'getPricing').mockResolvedValue([]));

    const program = new Command();
    program.addCommand(pricingCommand);
    await program.parseAsync(['node', 'test', 'pricing', 'register', 'xyz']);

    expect(logs.some((l) => l.includes('No pricing information found'))).toBe(true);
  });

  test('outputs JSON with --json flag', async () => {
    trackSpy(
      spyOn(usersApi, 'getPricing').mockResolvedValue([
        {
          productType: 'DOMAIN',
          productCategory: 'DOMAINS',
          productName: 'com',
          price: 8.88,
          additionalCost: 0.18,
          regularPrice: 10.98,
          yourPrice: 8.88,
          yourPriceType: 'CUSTOMER',
          currency: 'USD',
          duration: 1,
        },
      ]),
    );

    const program = new Command();
    program.addCommand(pricingCommand);
    await program.parseAsync(['node', 'test', 'pricing', 'register', '--json']);

    const jsonOutput = logs.find((l) => l.includes('yourPrice'));
    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput!);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].yourPrice).toBe(8.88);
  });

  test('supports --years option', async () => {
    const getPricingSpy = trackSpy(spyOn(usersApi, 'getPricing').mockResolvedValue([]));

    const program = new Command();
    program.addCommand(pricingCommand);
    await program.parseAsync(['node', 'test', 'pricing', 'register', 'com', '--years', '3']);

    expect(getPricingSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ years: 3 }),
    );
  });
});

describe('users update command', () => {
  const requiredOptions = [
    '--email',
    'test@example.com',
    '--first-name',
    'John',
    '--last-name',
    'Doe',
    '--address1',
    '123 Main St',
    '--city',
    'New York',
    '--state',
    'NY',
    '--zip',
    '10001',
    '--country',
    'US',
    '--phone',
    '+1.5551234567',
  ];

  test('updates user with required options and shows success', async () => {
    const updateUserSpy = trackSpy(
      spyOn(usersApi, 'updateUser').mockResolvedValue({
        success: true,
        userId: '12345',
      }),
    );

    const program = new Command();
    program.addCommand(updateCommand);
    await program.parseAsync(['node', 'test', 'update', ...requiredOptions]);

    expect(updateUserSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        address1: '123 Main St',
        city: 'New York',
        stateProvince: 'NY',
        zip: '10001',
        country: 'US',
        phone: '+1.5551234567',
      }),
    );
    expect(logs.some((l) => l.includes('User updated successfully'))).toBe(true);
    expect(logs.some((l) => l.includes('12345'))).toBe(true);
  });

  test('outputs JSON with --json flag', async () => {
    trackSpy(
      spyOn(usersApi, 'updateUser').mockResolvedValue({
        success: true,
        userId: '12345',
      }),
    );

    const program = new Command();
    program.addCommand(updateCommand);
    await program.parseAsync(['node', 'test', 'update', ...requiredOptions, '--json']);

    const jsonOutput = logs.find((l) => l.includes('userId'));
    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput!);
    expect(parsed.success).toBe(true);
    expect(parsed.userId).toBe('12345');
  });

  test('exits with code 1 when missing required options', async () => {
    const program = new Command();
    program.addCommand(updateCommand);

    try {
      await program.parseAsync(['node', 'test', 'update', '--email', 'test@example.com']);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });
});

describe('users create command', () => {
  const requiredOptions = [
    '--username',
    'newuser',
    '--password',
    'SecurePass123!',
    '--email',
    'newuser@example.com',
    '--first-name',
    'Jane',
    '--last-name',
    'Smith',
    '--address1',
    '456 Oak Ave',
    '--city',
    'Los Angeles',
    '--state',
    'CA',
    '--zip',
    '90001',
    '--country',
    'US',
    '--phone',
    '+1.5559876543',
  ];

  test('creates user with --accept-terms and shows success', async () => {
    const createUserSpy = trackSpy(
      spyOn(usersApi, 'createUser').mockResolvedValue({
        success: true,
        userId: '67890',
      }),
    );

    const program = new Command();
    program.addCommand(createCommand);
    await program.parseAsync(['node', 'test', 'create', ...requiredOptions, '--accept-terms']);

    expect(createUserSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        username: 'newuser',
        password: 'SecurePass123!',
        email: 'newuser@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        acceptTerms: true,
      }),
    );
    expect(logs.some((l) => l.includes('User created successfully'))).toBe(true);
    expect(logs.some((l) => l.includes('67890'))).toBe(true);
  });

  test('outputs JSON with --json flag', async () => {
    trackSpy(
      spyOn(usersApi, 'createUser').mockResolvedValue({
        success: true,
        userId: '67890',
      }),
    );

    const program = new Command();
    program.addCommand(createCommand);
    await program.parseAsync([
      'node',
      'test',
      'create',
      ...requiredOptions,
      '--accept-terms',
      '--json',
    ]);

    const jsonOutput = logs.find((l) => l.includes('userId'));
    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput!);
    expect(parsed.success).toBe(true);
    expect(parsed.userId).toBe('67890');
  });

  test('exits with code 1 without --accept-terms', async () => {
    const program = new Command();
    program.addCommand(createCommand);

    try {
      await program.parseAsync(['node', 'test', 'create', ...requiredOptions]);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
    expect(errors.some((l) => l.includes('accept the terms'))).toBe(true);
  });

  test('exits with code 1 when missing required options', async () => {
    const program = new Command();
    program.addCommand(createCommand);

    try {
      await program.parseAsync([
        'node',
        'test',
        'create',
        '--username',
        'newuser',
        '--accept-terms',
      ]);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });
});

describe('users add-funds command', () => {
  test('displays token and redirect URL with required options', async () => {
    trackSpy(
      spyOn(config, 'getCredentials').mockReturnValue({
        apiUser: 'testuser',
        apiKey: 'testkey',
        userName: 'testuser',
      }),
    );
    const createAddFundsSpy = trackSpy(
      spyOn(usersApi, 'createAddFundsRequest').mockResolvedValue({
        tokenId: 'abc123token',
        redirectUrl: 'https://namecheap.com/payment/abc123',
        returnUrl: 'https://mysite.com/callback',
      }),
    );

    const program = new Command();
    program.addCommand(addFundsCommand);
    await program.parseAsync([
      'node',
      'test',
      'add-funds',
      '--amount',
      '50',
      '--return-url',
      'https://mysite.com/callback',
    ]);

    expect(createAddFundsSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        username: 'testuser',
        amount: 50,
        returnUrl: 'https://mysite.com/callback',
      }),
    );
    expect(logs.some((l) => l.includes('abc123token'))).toBe(true);
    expect(logs.some((l) => l.includes('https://namecheap.com/payment/abc123'))).toBe(true);
  });

  test('outputs JSON with --json flag', async () => {
    trackSpy(
      spyOn(config, 'getCredentials').mockReturnValue({
        apiUser: 'testuser',
        apiKey: 'testkey',
        userName: 'testuser',
      }),
    );
    trackSpy(
      spyOn(usersApi, 'createAddFundsRequest').mockResolvedValue({
        tokenId: 'abc123token',
        redirectUrl: 'https://namecheap.com/payment/abc123',
        returnUrl: 'https://mysite.com/callback',
      }),
    );

    const program = new Command();
    program.addCommand(addFundsCommand);
    await program.parseAsync([
      'node',
      'test',
      'add-funds',
      '--amount',
      '50',
      '--return-url',
      'https://mysite.com/callback',
      '--json',
    ]);

    const jsonOutput = logs.find((l) => l.includes('tokenId'));
    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput!);
    expect(parsed.tokenId).toBe('abc123token');
    expect(parsed.redirectUrl).toBe('https://namecheap.com/payment/abc123');
  });

  test('exits with code 1 when missing --amount', async () => {
    const program = new Command();
    program.addCommand(addFundsCommand);

    try {
      await program.parseAsync([
        'node',
        'test',
        'add-funds',
        '--return-url',
        'https://mysite.com/callback',
      ]);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });

  test('exits with code 1 when missing --return-url', async () => {
    const program = new Command();
    program.addCommand(addFundsCommand);

    try {
      await program.parseAsync(['node', 'test', 'add-funds', '--amount', '50']);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });

  test('exits with code 1 when amount is invalid', async () => {
    trackSpy(
      spyOn(config, 'getCredentials').mockReturnValue({
        apiUser: 'testuser',
        apiKey: 'testkey',
        userName: 'testuser',
      }),
    );

    const program = new Command();
    program.addCommand(addFundsCommand);

    try {
      await program.parseAsync([
        'node',
        'test',
        'add-funds',
        '--amount',
        'invalid',
        '--return-url',
        'https://mysite.com/callback',
      ]);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });
});

describe('users funds-status command', () => {
  test('displays status info for token', async () => {
    const getAddFundsStatusSpy = trackSpy(
      spyOn(usersApi, 'getAddFundsStatus').mockResolvedValue({
        transactionId: 'txn-12345',
        amount: 100.0,
        status: 'COMPLETED',
      }),
    );

    const program = new Command();
    program.addCommand(fundsStatusCommand);
    await program.parseAsync(['node', 'test', 'funds-status', 'abc123token']);

    expect(getAddFundsStatusSpy).toHaveBeenCalledWith(expect.anything(), 'abc123token');
    expect(logs.some((l) => l.includes('txn-12345'))).toBe(true);
    expect(logs.some((l) => l.includes('$100.00'))).toBe(true);
    expect(logs.some((l) => l.includes('COMPLETED'))).toBe(true);
  });

  test('outputs JSON with --json flag', async () => {
    trackSpy(
      spyOn(usersApi, 'getAddFundsStatus').mockResolvedValue({
        transactionId: 'txn-12345',
        amount: 100.0,
        status: 'COMPLETED',
      }),
    );

    const program = new Command();
    program.addCommand(fundsStatusCommand);
    await program.parseAsync(['node', 'test', 'funds-status', 'abc123token', '--json']);

    const jsonOutput = logs.find((l) => l.includes('transactionId'));
    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput!);
    expect(parsed.transactionId).toBe('txn-12345');
    expect(parsed.amount).toBe(100.0);
    expect(parsed.status).toBe('COMPLETED');
  });

  test('handles different status values', async () => {
    trackSpy(
      spyOn(usersApi, 'getAddFundsStatus').mockResolvedValue({
        transactionId: '',
        amount: 50.0,
        status: 'CREATED',
      }),
    );

    const program = new Command();
    program.addCommand(fundsStatusCommand);
    await program.parseAsync(['node', 'test', 'funds-status', 'pending-token']);

    expect(logs.some((l) => l.includes('CREATED'))).toBe(true);
    expect(logs.some((l) => l.includes('$50.00'))).toBe(true);
  });
});

describe('users change-password command', () => {
  test('changes password with --old-password and shows success', async () => {
    const changePasswordSpy = trackSpy(
      spyOn(usersApi, 'changePassword').mockResolvedValue({
        success: true,
        userId: '12345',
      }),
    );

    const program = new Command();
    program.addCommand(changePasswordCommand);
    await program.parseAsync([
      'node',
      'test',
      'change-password',
      '--old-password',
      'OldPass123',
      '--new-password',
      'NewPass456!',
    ]);

    expect(changePasswordSpy).toHaveBeenCalledWith(expect.anything(), {
      oldPassword: 'OldPass123',
      newPassword: 'NewPass456!',
    });
    expect(logs.some((l) => l.includes('Password changed successfully'))).toBe(true);
    expect(logs.some((l) => l.includes('12345'))).toBe(true);
  });

  test('changes password with --reset-code and shows success', async () => {
    const changePasswordSpy = trackSpy(
      spyOn(usersApi, 'changePassword').mockResolvedValue({
        success: true,
        userId: '12345',
      }),
    );

    const program = new Command();
    program.addCommand(changePasswordCommand);
    await program.parseAsync([
      'node',
      'test',
      'change-password',
      '--reset-code',
      'RESET-ABC-123',
      '--new-password',
      'NewPass456!',
    ]);

    expect(changePasswordSpy).toHaveBeenCalledWith(expect.anything(), {
      resetCode: 'RESET-ABC-123',
      newPassword: 'NewPass456!',
    });
    expect(logs.some((l) => l.includes('Password changed successfully'))).toBe(true);
  });

  test('outputs JSON with --json flag', async () => {
    trackSpy(
      spyOn(usersApi, 'changePassword').mockResolvedValue({
        success: true,
        userId: '12345',
      }),
    );

    const program = new Command();
    program.addCommand(changePasswordCommand);
    await program.parseAsync([
      'node',
      'test',
      'change-password',
      '--old-password',
      'OldPass123',
      '--new-password',
      'NewPass456!',
      '--json',
    ]);

    const jsonOutput = logs.find((l) => l.includes('userId'));
    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput!);
    expect(parsed.success).toBe(true);
    expect(parsed.userId).toBe('12345');
  });

  test('exits with code 1 without --old-password or --reset-code', async () => {
    const program = new Command();
    program.addCommand(changePasswordCommand);

    try {
      await program.parseAsync([
        'node',
        'test',
        'change-password',
        '--new-password',
        'NewPass456!',
      ]);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
    expect(errors.some((l) => l.includes('--old-password or --reset-code is required'))).toBe(true);
  });

  test('exits with code 1 when both --old-password and --reset-code provided', async () => {
    const program = new Command();
    program.addCommand(changePasswordCommand);

    try {
      await program.parseAsync([
        'node',
        'test',
        'change-password',
        '--old-password',
        'OldPass123',
        '--reset-code',
        'RESET-ABC-123',
        '--new-password',
        'NewPass456!',
      ]);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
    expect(errors.some((l) => l.includes('Cannot use both'))).toBe(true);
  });

  test('exits with code 1 when missing --new-password', async () => {
    const program = new Command();
    program.addCommand(changePasswordCommand);

    try {
      await program.parseAsync(['node', 'test', 'change-password', '--old-password', 'OldPass123']);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });
});

describe('users reset-password command', () => {
  test('requests reset with --find-by and --value, shows success', async () => {
    const resetPasswordSpy = trackSpy(
      spyOn(usersApi, 'resetPassword').mockResolvedValue({
        success: true,
      }),
    );

    const program = new Command();
    program.addCommand(resetPasswordCommand);
    await program.parseAsync([
      'node',
      'test',
      'reset-password',
      '--find-by',
      'email',
      '--value',
      'user@example.com',
    ]);

    expect(resetPasswordSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        findBy: 'EMAILADDRESS',
        findByValue: 'user@example.com',
      }),
    );
    expect(logs.some((l) => l.includes('Password reset email sent successfully'))).toBe(true);
  });

  test('supports username find-by option', async () => {
    const resetPasswordSpy = trackSpy(
      spyOn(usersApi, 'resetPassword').mockResolvedValue({
        success: true,
      }),
    );

    const program = new Command();
    program.addCommand(resetPasswordCommand);
    await program.parseAsync([
      'node',
      'test',
      'reset-password',
      '--find-by',
      'username',
      '--value',
      'testuser',
    ]);

    expect(resetPasswordSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        findBy: 'USERNAME',
        findByValue: 'testuser',
      }),
    );
  });

  test('supports domain find-by option', async () => {
    const resetPasswordSpy = trackSpy(
      spyOn(usersApi, 'resetPassword').mockResolvedValue({
        success: true,
      }),
    );

    const program = new Command();
    program.addCommand(resetPasswordCommand);
    await program.parseAsync([
      'node',
      'test',
      'reset-password',
      '--find-by',
      'domain',
      '--value',
      'example.com',
    ]);

    expect(resetPasswordSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        findBy: 'DOMAINNAME',
        findByValue: 'example.com',
      }),
    );
  });

  test('outputs JSON with --json flag', async () => {
    trackSpy(
      spyOn(usersApi, 'resetPassword').mockResolvedValue({
        success: true,
      }),
    );

    const program = new Command();
    program.addCommand(resetPasswordCommand);
    await program.parseAsync([
      'node',
      'test',
      'reset-password',
      '--find-by',
      'email',
      '--value',
      'user@example.com',
      '--json',
    ]);

    const jsonOutput = logs.find((l) => l.includes('success'));
    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput!);
    expect(parsed.success).toBe(true);
  });

  test('exits with code 1 for invalid --find-by value', async () => {
    const program = new Command();
    program.addCommand(resetPasswordCommand);

    try {
      await program.parseAsync([
        'node',
        'test',
        'reset-password',
        '--find-by',
        'invalid',
        '--value',
        'test@example.com',
      ]);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
    expect(errors.some((l) => l.includes('Invalid --find-by value'))).toBe(true);
  });

  test('exits with code 1 when missing required options', async () => {
    const program = new Command();
    program.addCommand(resetPasswordCommand);

    try {
      await program.parseAsync(['node', 'test', 'reset-password', '--find-by', 'email']);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });
});

describe('users login command', () => {
  test('shows success for valid credentials', async () => {
    const loginUserSpy = trackSpy(
      spyOn(usersApi, 'loginUser').mockResolvedValue({
        username: 'testuser',
        loginSuccess: true,
      }),
    );

    const program = new Command();
    program.addCommand(loginCommand);
    await program.parseAsync(['node', 'test', 'login', 'testuser', '--password', 'TestPass123!']);

    expect(loginUserSpy).toHaveBeenCalledWith(expect.anything(), 'testuser', 'TestPass123!');
    expect(logs.some((l) => l.includes('Login successful'))).toBe(true);
    expect(logs.some((l) => l.includes('testuser'))).toBe(true);
  });

  test('shows failure for invalid credentials', async () => {
    trackSpy(
      spyOn(usersApi, 'loginUser').mockResolvedValue({
        username: 'wronguser',
        loginSuccess: false,
      }),
    );

    const program = new Command();
    program.addCommand(loginCommand);
    await program.parseAsync(['node', 'test', 'login', 'wronguser', '--password', 'BadPassword']);

    expect(errors.some((l) => l.includes('Login failed'))).toBe(true);
  });

  test('outputs JSON with --json flag for success', async () => {
    trackSpy(
      spyOn(usersApi, 'loginUser').mockResolvedValue({
        username: 'testuser',
        loginSuccess: true,
      }),
    );

    const program = new Command();
    program.addCommand(loginCommand);
    await program.parseAsync([
      'node',
      'test',
      'login',
      'testuser',
      '--password',
      'TestPass123!',
      '--json',
    ]);

    const jsonOutput = logs.find((l) => l.includes('loginSuccess'));
    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput!);
    expect(parsed.username).toBe('testuser');
    expect(parsed.loginSuccess).toBe(true);
  });

  test('outputs JSON with --json flag for failure', async () => {
    trackSpy(
      spyOn(usersApi, 'loginUser').mockResolvedValue({
        username: 'testuser',
        loginSuccess: false,
      }),
    );

    const program = new Command();
    program.addCommand(loginCommand);
    await program.parseAsync([
      'node',
      'test',
      'login',
      'testuser',
      '--password',
      'BadPassword',
      '--json',
    ]);

    const jsonOutput = logs.find((l) => l.includes('loginSuccess'));
    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput!);
    expect(parsed.loginSuccess).toBe(false);
  });

  test('exits with code 1 when missing --password', async () => {
    const program = new Command();
    program.addCommand(loginCommand);

    try {
      await program.parseAsync(['node', 'test', 'login', 'testuser']);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });

  test('exits with code 1 when missing username argument', async () => {
    const program = new Command();
    program.addCommand(loginCommand);

    try {
      await program.parseAsync(['node', 'test', 'login', '--password', 'TestPass123!']);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });
});
