import { describe, expect, test, beforeEach, afterEach, mock, spyOn, type Mock } from 'bun:test';
import { Command } from 'commander';
import { balancesCommand } from '../../src/commands/users/balances.js';
import { pricingCommand } from '../../src/commands/users/pricing.js';
import * as client from '../../src/lib/api/client.js';
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
