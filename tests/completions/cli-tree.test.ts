import { describe, expect, test } from 'bun:test';
import { createProgram } from '../../src/cli';
import { commandToNode, type CmdNode } from '../../src/completions/model';

describe('CLI command tree', () => {
  const program = createProgram({ includeCompletions: false });
  const tree = commandToNode(program);

  function getCommand(name: string): CmdNode | undefined {
    return tree.subcommands.find((c) => c.name === name);
  }

  function getSubcommandNames(commandName: string): string[] {
    const cmd = getCommand(commandName);
    return cmd?.subcommands.map((s) => s.name) ?? [];
  }

  test('has all top-level commands', () => {
    const expectedCommands = [
      'address',
      'auth',
      'config',
      'dns',
      'domains',
      'ns',
      'users',
      'whoisguard',
    ];

    const actualCommands = tree.subcommands.map((c) => c.name);

    for (const cmd of expectedCommands) {
      expect(actualCommands).toContain(cmd);
    }
  });

  test('address has all subcommands', () => {
    const expected = ['create', 'delete', 'info', 'list', 'set-default', 'update'];
    const actual = getSubcommandNames('address');

    for (const cmd of expected) {
      expect(actual).toContain(cmd);
    }
  });

  test('auth has all subcommands', () => {
    const expected = ['login', 'logout', 'status'];
    const actual = getSubcommandNames('auth');

    for (const cmd of expected) {
      expect(actual).toContain(cmd);
    }
  });

  test('config has all subcommands', () => {
    const expected = ['get', 'list', 'path', 'set'];
    const actual = getSubcommandNames('config');

    for (const cmd of expected) {
      expect(actual).toContain(cmd);
    }
  });

  test('dns has all subcommands', () => {
    const expected = ['add', 'email', 'list', 'rm', 'set'];
    const actual = getSubcommandNames('dns');

    for (const cmd of expected) {
      expect(actual).toContain(cmd);
    }
  });

  test('domains has all subcommands', () => {
    const expected = [
      'check',
      'contacts',
      'info',
      'list',
      'lock',
      'reactivate',
      'register',
      'renew',
      'unlock',
    ];
    const actual = getSubcommandNames('domains');

    for (const cmd of expected) {
      expect(actual).toContain(cmd);
    }
  });

  test('ns has all subcommands', () => {
    const expected = ['create', 'delete', 'info', 'list', 'reset', 'set', 'update'];
    const actual = getSubcommandNames('ns');

    for (const cmd of expected) {
      expect(actual).toContain(cmd);
    }
  });

  test('users has all subcommands', () => {
    const expected = [
      'add-funds',
      'balances',
      'change-password',
      'create',
      'funds-status',
      'login',
      'pricing',
      'reset-password',
      'update',
    ];
    const actual = getSubcommandNames('users');

    for (const cmd of expected) {
      expect(actual).toContain(cmd);
    }
  });

  test('whoisguard has all subcommands', () => {
    const expected = ['allot', 'disable', 'enable', 'list', 'renew', 'unallot'];
    const actual = getSubcommandNames('whoisguard');

    for (const cmd of expected) {
      expect(actual).toContain(cmd);
    }
  });

  test('all commands have descriptions', () => {
    for (const cmd of tree.subcommands) {
      expect(cmd.description).toBeTruthy();
      expect(cmd.description?.length).toBeGreaterThan(0);

      for (const sub of cmd.subcommands) {
        expect(sub.description).toBeTruthy();
        expect(sub.description?.length).toBeGreaterThan(0);
      }
    }
  });
});
