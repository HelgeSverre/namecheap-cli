import { describe, expect, test, beforeEach, afterEach, mock, spyOn, type Mock } from 'bun:test';
import { Command } from 'commander';
import { listCommand } from '../../src/commands/address/list.js';
import { infoCommand } from '../../src/commands/address/info.js';
import { createCommand } from '../../src/commands/address/create.js';
import { updateCommand } from '../../src/commands/address/update.js';
import { deleteCommand } from '../../src/commands/address/delete.js';
import { setDefaultCommand } from '../../src/commands/address/set-default.js';
import * as client from '../../src/lib/api/client.js';
import * as addressApi from '../../src/lib/api/address.js';
import * as spinner from '../../src/utils/spinner.js';
import * as prompts from '@inquirer/prompts';

let originalLog: typeof console.log;
let originalError: typeof console.error;
let logs: string[];
let errors: string[];

let originalExit: typeof process.exit;
let exitCode: number | undefined;

type AnyMock = Mock<(...args: any[]) => any>;
let spies: AnyMock[];

function trackSpy<T extends (...args: any[]) => any>(spy: Mock<T>): Mock<T> {
  spies.push(spy as AnyMock);
  return spy;
}

const mockClient = {
  request: mock(() => Promise.resolve({ success: true, errors: [], warnings: [], data: {} })),
  post: mock(() => Promise.resolve({ success: true, errors: [], warnings: [], data: {} })),
};

beforeEach(() => {
  spies = [];

  logs = [];
  errors = [];
  originalLog = console.log;
  originalError = console.error;
  console.log = (...args: unknown[]) => logs.push(args.map(String).join(' '));
  console.error = (...args: unknown[]) => errors.push(args.map(String).join(' '));

  originalExit = process.exit;
  exitCode = undefined;
  process.exit = ((code?: number) => {
    exitCode = code;
    throw new Error(`process.exit(${code})`);
  }) as typeof process.exit;

  trackSpy(
    spyOn(client, 'getClient').mockReturnValue(mockClient as unknown as client.NamecheapClient),
  );

  trackSpy(spyOn(spinner, 'withSpinner').mockImplementation(async (_text, fn) => fn()));
});

afterEach(() => {
  console.log = originalLog;
  console.error = originalError;
  process.exit = originalExit;

  spies.forEach((spy) => {
    spy.mockRestore();
  });
});

describe('address list command', () => {
  test('displays addresses in table', async () => {
    trackSpy(
      spyOn(addressApi, 'getAddressList').mockResolvedValue({
        items: [
          { id: '1', name: 'Home Address' },
          { id: '2', name: 'Work Address' },
        ],
      }),
    );

    const program = new Command();
    program.addCommand(listCommand);
    await program.parseAsync(['node', 'test', 'list']);

    expect(logs.some((l) => l.includes('Home Address'))).toBe(true);
    expect(logs.some((l) => l.includes('Work Address'))).toBe(true);
  });

  test('shows message when no addresses found', async () => {
    trackSpy(
      spyOn(addressApi, 'getAddressList').mockResolvedValue({
        items: [],
      }),
    );

    const program = new Command();
    program.addCommand(listCommand);
    await program.parseAsync(['node', 'test', 'list']);

    expect(logs.some((l) => l.includes('No addresses found'))).toBe(true);
  });

  test('outputs JSON with --json flag', async () => {
    trackSpy(
      spyOn(addressApi, 'getAddressList').mockResolvedValue({
        items: [
          { id: '1', name: 'Home Address' },
          { id: '2', name: 'Work Address' },
        ],
      }),
    );

    const program = new Command();
    program.addCommand(listCommand);
    await program.parseAsync(['node', 'test', 'list', '--json']);

    const jsonOutput = logs.find((l) => l.includes('Home Address'));
    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput!);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].id).toBe('1');
    expect(parsed[0].name).toBe('Home Address');
  });

  test('handles API error', async () => {
    trackSpy(
      spyOn(addressApi, 'getAddressList').mockRejectedValue(
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

describe('address info command', () => {
  const mockAddressInfo: addressApi.AddressInfo = {
    id: '123',
    name: 'Home Address',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    address1: '123 Main St',
    city: 'New York',
    stateProvince: 'NY',
    stateProvinceChoice: 'NY',
    zip: '10001',
    country: 'US',
    phone: '+1.5551234567',
    default: true,
  };

  test('displays address details', async () => {
    trackSpy(spyOn(addressApi, 'getAddressInfo').mockResolvedValue(mockAddressInfo));

    const program = new Command();
    program.addCommand(infoCommand);
    await program.parseAsync(['node', 'test', 'info', '123']);

    expect(logs.some((l) => l.includes('John'))).toBe(true);
    expect(logs.some((l) => l.includes('Doe'))).toBe(true);
    expect(logs.some((l) => l.includes('john@example.com'))).toBe(true);
    expect(logs.some((l) => l.includes('123 Main St'))).toBe(true);
  });

  test('calls API with correct address ID', async () => {
    const getAddressInfoSpy = trackSpy(
      spyOn(addressApi, 'getAddressInfo').mockResolvedValue(mockAddressInfo),
    );

    const program = new Command();
    program.addCommand(infoCommand);
    await program.parseAsync(['node', 'test', 'info', '456']);

    expect(getAddressInfoSpy).toHaveBeenCalledWith(expect.anything(), '456');
  });

  test('outputs JSON with --json flag', async () => {
    trackSpy(spyOn(addressApi, 'getAddressInfo').mockResolvedValue(mockAddressInfo));

    const program = new Command();
    program.addCommand(infoCommand);
    await program.parseAsync(['node', 'test', 'info', '123', '--json']);

    const jsonOutput = logs.find((l) => l.includes('firstName'));
    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput!);
    expect(parsed.id).toBe('123');
    expect(parsed.firstName).toBe('John');
    expect(parsed.email).toBe('john@example.com');
  });

  test('handles API error', async () => {
    trackSpy(
      spyOn(addressApi, 'getAddressInfo').mockRejectedValue(
        new Error('API Error: Address not found'),
      ),
    );

    const program = new Command();
    program.addCommand(infoCommand);

    try {
      await program.parseAsync(['node', 'test', 'info', '999']);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });
});

describe('address create command', () => {
  const requiredOptions = [
    '--name',
    'Test Address',
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

  test('creates address with required options', async () => {
    const createAddressSpy = trackSpy(
      spyOn(addressApi, 'createAddress').mockResolvedValue({
        success: true,
        addressId: '789',
        addressName: 'Test Address',
      }),
    );

    const program = new Command();
    program.addCommand(createCommand);
    await program.parseAsync(['node', 'test', 'create', ...requiredOptions]);

    expect(createAddressSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        name: 'Test Address',
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
  });

  test('shows success message', async () => {
    trackSpy(
      spyOn(addressApi, 'createAddress').mockResolvedValue({
        success: true,
        addressId: '789',
        addressName: 'Test Address',
      }),
    );

    const program = new Command();
    program.addCommand(createCommand);
    await program.parseAsync(['node', 'test', 'create', ...requiredOptions]);

    expect(logs.some((l) => l.includes('Test Address') && l.includes('789'))).toBe(true);
  });

  test('outputs JSON with --json flag', async () => {
    trackSpy(
      spyOn(addressApi, 'createAddress').mockResolvedValue({
        success: true,
        addressId: '789',
        addressName: 'Test Address',
      }),
    );

    const program = new Command();
    program.addCommand(createCommand);
    await program.parseAsync(['node', 'test', 'create', ...requiredOptions, '--json']);

    const jsonOutput = logs.find((l) => l.includes('addressId'));
    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput!);
    expect(parsed.addressId).toBe('789');
    expect(parsed.addressName).toBe('Test Address');
  });

  test('handles API error', async () => {
    trackSpy(
      spyOn(addressApi, 'createAddress').mockRejectedValue(new Error('API Error: Invalid input')),
    );

    const program = new Command();
    program.addCommand(createCommand);

    try {
      await program.parseAsync(['node', 'test', 'create', ...requiredOptions]);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });
});

describe('address update command', () => {
  const requiredOptions = [
    '--name',
    'Updated Address',
    '--email',
    'updated@example.com',
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

  test('updates address with required options', async () => {
    const updateAddressSpy = trackSpy(
      spyOn(addressApi, 'updateAddress').mockResolvedValue({
        success: true,
        addressId: '123',
        addressName: 'Updated Address',
      }),
    );

    const program = new Command();
    program.addCommand(updateCommand);
    await program.parseAsync(['node', 'test', 'update', '123', ...requiredOptions]);

    expect(updateAddressSpy).toHaveBeenCalledWith(
      expect.anything(),
      '123',
      expect.objectContaining({
        name: 'Updated Address',
        email: 'updated@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
      }),
    );
  });

  test('shows success message', async () => {
    trackSpy(
      spyOn(addressApi, 'updateAddress').mockResolvedValue({
        success: true,
        addressId: '123',
        addressName: 'Updated Address',
      }),
    );

    const program = new Command();
    program.addCommand(updateCommand);
    await program.parseAsync(['node', 'test', 'update', '123', ...requiredOptions]);

    expect(logs.some((l) => l.includes('Updated Address') && l.includes('123'))).toBe(true);
  });

  test('outputs JSON with --json flag', async () => {
    trackSpy(
      spyOn(addressApi, 'updateAddress').mockResolvedValue({
        success: true,
        addressId: '123',
        addressName: 'Updated Address',
      }),
    );

    const program = new Command();
    program.addCommand(updateCommand);
    await program.parseAsync(['node', 'test', 'update', '123', ...requiredOptions, '--json']);

    const jsonOutput = logs.find((l) => l.includes('addressId'));
    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput!);
    expect(parsed.addressId).toBe('123');
    expect(parsed.addressName).toBe('Updated Address');
  });

  test('handles API error', async () => {
    trackSpy(
      spyOn(addressApi, 'updateAddress').mockRejectedValue(
        new Error('API Error: Address not found'),
      ),
    );

    const program = new Command();
    program.addCommand(updateCommand);

    try {
      await program.parseAsync(['node', 'test', 'update', '999', ...requiredOptions]);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });
});

describe('address delete command', () => {
  test('deletes address with --force flag', async () => {
    const deleteAddressSpy = trackSpy(
      spyOn(addressApi, 'deleteAddress').mockResolvedValue({
        success: true,
        profileId: '456',
        username: 'testuser',
      }),
    );

    const program = new Command();
    program.addCommand(deleteCommand);
    await program.parseAsync(['node', 'test', 'delete', '123', '--force']);

    expect(deleteAddressSpy).toHaveBeenCalledWith(expect.anything(), '123');
  });

  test('shows success message', async () => {
    trackSpy(
      spyOn(addressApi, 'deleteAddress').mockResolvedValue({
        success: true,
        profileId: '456',
        username: 'testuser',
      }),
    );

    const program = new Command();
    program.addCommand(deleteCommand);
    await program.parseAsync(['node', 'test', 'delete', '123', '--force']);

    expect(logs.some((l) => l.includes('123') && l.includes('deleted'))).toBe(true);
  });

  test('skips confirmation with --force', async () => {
    const confirmSpy = trackSpy(spyOn(prompts, 'confirm').mockResolvedValue(true));

    trackSpy(
      spyOn(addressApi, 'deleteAddress').mockResolvedValue({
        success: true,
        profileId: '456',
        username: 'testuser',
      }),
    );

    const program = new Command();
    program.addCommand(deleteCommand);
    await program.parseAsync(['node', 'test', 'delete', '123', '--force']);

    expect(confirmSpy).not.toHaveBeenCalled();
  });

  test('prompts for confirmation without --force', async () => {
    trackSpy(spyOn(prompts, 'confirm').mockResolvedValue(true));

    trackSpy(
      spyOn(addressApi, 'deleteAddress').mockResolvedValue({
        success: true,
        profileId: '456',
        username: 'testuser',
      }),
    );

    const program = new Command();
    program.addCommand(deleteCommand);
    await program.parseAsync(['node', 'test', 'delete', '123']);

    expect(logs.some((l) => l.includes('Warning'))).toBe(true);
  });

  test('cancels when confirmation is declined', async () => {
    trackSpy(spyOn(prompts, 'confirm').mockResolvedValue(false));

    const deleteAddressSpy = trackSpy(
      spyOn(addressApi, 'deleteAddress').mockResolvedValue({
        success: true,
        profileId: '456',
        username: 'testuser',
      }),
    );

    const program = new Command();
    program.addCommand(deleteCommand);
    await program.parseAsync(['node', 'test', 'delete', '123']);

    expect(deleteAddressSpy).not.toHaveBeenCalled();
    expect(logs.some((l) => l.includes('Cancelled'))).toBe(true);
  });

  test('outputs JSON with --json flag', async () => {
    trackSpy(
      spyOn(addressApi, 'deleteAddress').mockResolvedValue({
        success: true,
        profileId: '456',
        username: 'testuser',
      }),
    );

    const program = new Command();
    program.addCommand(deleteCommand);
    await program.parseAsync(['node', 'test', 'delete', '123', '--force', '--json']);

    const jsonOutput = logs.find((l) => l.includes('deleted'));
    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput!);
    expect(parsed.deleted).toBe(true);
    expect(parsed.addressId).toBe('123');
  });

  test('handles API error', async () => {
    trackSpy(
      spyOn(addressApi, 'deleteAddress').mockRejectedValue(
        new Error('API Error: Address not found'),
      ),
    );

    const program = new Command();
    program.addCommand(deleteCommand);

    try {
      await program.parseAsync(['node', 'test', 'delete', '999', '--force']);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });
});

describe('address set-default command', () => {
  test('sets address as default', async () => {
    const setDefaultSpy = trackSpy(
      spyOn(addressApi, 'setDefaultAddress').mockResolvedValue({
        success: true,
        addressId: '123',
      }),
    );

    const program = new Command();
    program.addCommand(setDefaultCommand);
    await program.parseAsync(['node', 'test', 'set-default', '123']);

    expect(setDefaultSpy).toHaveBeenCalledWith(expect.anything(), '123');
  });

  test('shows success message', async () => {
    trackSpy(
      spyOn(addressApi, 'setDefaultAddress').mockResolvedValue({
        success: true,
        addressId: '123',
      }),
    );

    const program = new Command();
    program.addCommand(setDefaultCommand);
    await program.parseAsync(['node', 'test', 'set-default', '123']);

    expect(logs.some((l) => l.includes('123') && l.includes('default'))).toBe(true);
  });

  test('outputs JSON with --json flag', async () => {
    trackSpy(
      spyOn(addressApi, 'setDefaultAddress').mockResolvedValue({
        success: true,
        addressId: '123',
      }),
    );

    const program = new Command();
    program.addCommand(setDefaultCommand);
    await program.parseAsync(['node', 'test', 'set-default', '123', '--json']);

    const jsonOutput = logs.find((l) => l.includes('addressId'));
    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput!);
    expect(parsed.success).toBe(true);
    expect(parsed.addressId).toBe('123');
  });

  test('handles API error', async () => {
    trackSpy(
      spyOn(addressApi, 'setDefaultAddress').mockRejectedValue(
        new Error('API Error: Address not found'),
      ),
    );

    const program = new Command();
    program.addCommand(setDefaultCommand);

    try {
      await program.parseAsync(['node', 'test', 'set-default', '999']);
    } catch (_e) {
      // Expected
    }

    expect(exitCode).toBe(1);
  });
});
