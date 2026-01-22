import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import { Command } from 'commander';
import { completionsCommand } from '../../src/commands/completions/index.js';

let originalLog: typeof console.log;
let originalError: typeof console.error;
let originalExit: typeof process.exit;
let logs: string[];
let errors: string[];
let exitCode: number | undefined;

beforeEach(() => {
  logs = [];
  errors = [];
  exitCode = undefined;

  originalLog = console.log;
  originalError = console.error;
  originalExit = process.exit;

  console.log = (...args: unknown[]) => logs.push(args.map(String).join(' '));
  console.error = (...args: unknown[]) => errors.push(args.map(String).join(' '));
  process.exit = ((code?: number) => {
    exitCode = code;
    throw new Error(`process.exit(${code})`);
  }) as typeof process.exit;
});

afterEach(() => {
  console.log = originalLog;
  console.error = originalError;
  process.exit = originalExit;
});

describe('completions command', () => {
  test('generates bash completion script', async () => {
    const program = new Command();
    program.addCommand(completionsCommand);
    await program.parseAsync(['node', 'test', 'completions', 'bash']);

    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0]).toContain('#!/bin/bash');
    expect(logs[0]).toContain('_namecheap_completions');
    expect(logs[0]).toContain('complete -F _namecheap_completions namecheap');
  });

  test('generates zsh completion script', async () => {
    const program = new Command();
    program.addCommand(completionsCommand);
    await program.parseAsync(['node', 'test', 'completions', 'zsh']);

    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0]).toContain('#compdef namecheap');
    expect(logs[0]).toContain('_namecheap()');
    expect(logs[0]).toContain('_describe -t commands');
  });

  test('generates fish completion script', async () => {
    const program = new Command();
    program.addCommand(completionsCommand);
    await program.parseAsync(['node', 'test', 'completions', 'fish']);

    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0]).toContain('# Namecheap CLI fish completion');
    expect(logs[0]).toContain('complete -c namecheap');
    expect(logs[0]).toContain('__fish_use_subcommand');
  });

  test('handles uppercase shell names', async () => {
    const program = new Command();
    program.addCommand(completionsCommand);
    await program.parseAsync(['node', 'test', 'completions', 'BASH']);

    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0]).toContain('#!/bin/bash');
  });

  test('exits with error for unknown shell', async () => {
    const program = new Command();
    program.addCommand(completionsCommand);

    try {
      await program.parseAsync(['node', 'test', 'completions', 'powershell']);
    } catch {
      // Expected
    }

    expect(exitCode).toBe(1);
    expect(errors.some((e) => e.includes('Unknown shell'))).toBe(true);
    expect(errors.some((e) => e.includes('Supported shells'))).toBe(true);
  });

  test('bash completion includes all command groups', async () => {
    const program = new Command();
    program.addCommand(completionsCommand);
    await program.parseAsync(['node', 'test', 'completions', 'bash']);

    const output = logs[0] ?? '';
    expect(output).toContain('auth');
    expect(output).toContain('domains');
    expect(output).toContain('dns');
    expect(output).toContain('ns');
    expect(output).toContain('config');
    expect(output).toContain('users');
    expect(output).toContain('whoisguard');
  });

  test('zsh completion includes subcommand descriptions', async () => {
    const program = new Command();
    program.addCommand(completionsCommand);
    await program.parseAsync(['node', 'test', 'completions', 'zsh']);

    const output = logs[0] ?? '';
    expect(output).toContain('login:Authenticate with Namecheap API');
    expect(output).toContain('list:List all domains');
    expect(output).toContain('balances:Show account balance');
  });

  test('fish completion includes subcommand descriptions', async () => {
    const program = new Command();
    program.addCommand(completionsCommand);
    await program.parseAsync(['node', 'test', 'completions', 'fish']);

    const output = logs[0] ?? '';
    expect(output).toContain('-d "Authenticate with Namecheap API"');
    expect(output).toContain('-d "List all domains"');
    expect(output).toContain('-d "Show account balance"');
  });
});
