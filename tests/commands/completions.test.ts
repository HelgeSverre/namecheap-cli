import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { Command } from 'commander';
import { completionsCommand } from '../../src/commands/completions/index';

describe('completions command', () => {
  let logs: string[];
  let errors: string[];
  let originalLog: typeof console.log;
  let originalError: typeof console.error;
  let originalExit: typeof process.exit;
  let exitCode: number | null;

  beforeEach(() => {
    logs = [];
    errors = [];
    exitCode = null;
    originalLog = console.log;
    originalError = console.error;
    originalExit = process.exit;

    console.log = (...args) => logs.push(args.map(String).join(' '));
    console.error = (...args) => errors.push(args.map(String).join(' '));
    process.exit = ((code?: number) => {
      exitCode = code ?? 0;
      throw new Error(`process.exit(${code})`);
    }) as never;
  });

  afterEach(() => {
    console.log = originalLog;
    console.error = originalError;
    process.exit = originalExit;
  });

  async function runCommand(...args: string[]) {
    const program = new Command();
    program.addCommand(completionsCommand);
    try {
      await program.parseAsync(['node', 'test', 'completions', ...args]);
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('process.exit')) {
        return;
      }
      throw e;
    }
  }

  describe('namecheap completions <shell>', () => {
    test('generates bash completions', async () => {
      await runCommand('bash');

      const output = logs.join('\n');
      expect(output).toContain('#!/bin/bash');
      expect(output).toContain('_namecheap_completions');
      expect(output).toContain('complete -F _namecheap_completions namecheap');
    });

    test('generates zsh completions', async () => {
      await runCommand('zsh');

      const output = logs.join('\n');
      expect(output).toContain('#compdef namecheap');
      expect(output).toContain('_namecheap()');
    });

    test('generates fish completions', async () => {
      await runCommand('fish');

      const output = logs.join('\n');
      expect(output).toContain('# Namecheap CLI fish completion');
      expect(output).toContain('complete -c namecheap');
    });

    test('errors on unknown shell', async () => {
      await runCommand('powershell');

      expect(exitCode).toBe(1);
      expect(errors.some((e) => e.includes('Unknown shell'))).toBe(true);
    });
  });

  describe('namecheap completions print <shell>', () => {
    test('prints bash completions', async () => {
      await runCommand('print', 'bash');

      const output = logs.join('\n');
      expect(output).toContain('#!/bin/bash');
    });

    test('prints zsh completions', async () => {
      await runCommand('print', 'zsh');

      const output = logs.join('\n');
      expect(output).toContain('#compdef namecheap');
    });

    test('prints fish completions', async () => {
      await runCommand('print', 'fish');

      const output = logs.join('\n');
      expect(output).toContain('# Namecheap CLI fish completion');
    });
  });

  describe('namecheap completions install', () => {
    test('shows dry run output', async () => {
      await runCommand('install', '--shell', 'bash', '--dry-run');

      const output = logs.join('\n');
      expect(output).toContain('Dry run mode');
      expect(output).toContain('Would');
    });

    test('errors on unknown shell', async () => {
      await runCommand('install', '--shell', 'powershell');

      expect(exitCode).toBe(1);
      expect(errors.some((e) => e.includes('Unknown shell'))).toBe(true);
    });
  });

  describe('namecheap completions path', () => {
    test('shows path for bash', async () => {
      await runCommand('path', '--shell', 'bash');

      const output = logs.join('\n');
      expect(output).toContain('bash-completion');
      expect(output).toContain('namecheap');
    });

    test('shows path for zsh', async () => {
      await runCommand('path', '--shell', 'zsh');

      const output = logs.join('\n');
      expect(output).toContain('_namecheap');
    });

    test('shows path for fish', async () => {
      await runCommand('path', '--shell', 'fish');

      const output = logs.join('\n');
      expect(output).toContain('namecheap.fish');
    });
  });

  describe('completions include all commands', () => {
    test('bash includes address command', async () => {
      await runCommand('bash');

      const output = logs.join('\n');
      expect(output).toContain('address');
      expect(output).toContain('create delete info list set-default update');
    });

    test('bash includes all users subcommands', async () => {
      await runCommand('bash');

      const output = logs.join('\n');
      expect(output).toContain('add-funds');
      expect(output).toContain('change-password');
      expect(output).toContain('reset-password');
      expect(output).toContain('funds-status');
    });

    test('bash includes domains unlock', async () => {
      await runCommand('bash');

      const output = logs.join('\n');
      expect(output).toContain('unlock');
    });
  });
});
