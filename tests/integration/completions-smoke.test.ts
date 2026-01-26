import { describe, expect, test, beforeAll, afterAll } from 'bun:test';
import { spawn } from 'child_process';
import * as path from 'path';

const ROOT_DIR = path.resolve(__dirname, '../..');

async function runCommand(
  cmd: string,
  args: string[],
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, { cwd: ROOT_DIR });
    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data) => (stdout += data.toString()));
    proc.stderr?.on('data', (data) => (stderr += data.toString()));

    proc.on('close', (code) => {
      resolve({ stdout, stderr, exitCode: code ?? 0 });
    });
  });
}

describe('Completions smoke tests', () => {
  describe('Script generation', () => {
    test('generates valid bash completion script', async () => {
      const result = await runCommand('bun', ['run', 'src/index.ts', 'completions', 'bash']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('#!/bin/bash');
      expect(result.stdout).toContain('_namecheap_completions');
      expect(result.stdout).toContain('complete -F _namecheap_completions namecheap');
      expect(result.stdout).toContain('address');
      expect(result.stdout).toContain('add-funds');
    });

    test('generates valid zsh completion script', async () => {
      const result = await runCommand('bun', ['run', 'src/index.ts', 'completions', 'zsh']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('#compdef namecheap');
      expect(result.stdout).toContain('_namecheap()');
      expect(result.stdout).toContain('_namecheap "$@"');
      expect(result.stdout).toContain('address');
      expect(result.stdout).toContain('add-funds');
    });

    test('generates valid fish completion script', async () => {
      const result = await runCommand('bun', ['run', 'src/index.ts', 'completions', 'fish']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('# Namecheap CLI fish completion');
      expect(result.stdout).toContain('complete -c namecheap');
      expect(result.stdout).toContain('__fish_use_subcommand');
      expect(result.stdout).toContain('address');
      expect(result.stdout).toContain('add-funds');
    });
  });

  describe('Install command', () => {
    test('dry-run shows install path', async () => {
      const result = await runCommand('bun', [
        'run',
        'src/index.ts',
        'completions',
        'install',
        '--shell',
        'bash',
        '--dry-run',
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Dry run mode');
      expect(result.stdout).toContain('Would');
      expect(result.stdout).toContain('namecheap');
    });

    test('path command shows installation location', async () => {
      const result = await runCommand('bun', [
        'run',
        'src/index.ts',
        'completions',
        'path',
        '--shell',
        'bash',
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('bash-completion');
      expect(result.stdout).toContain('namecheap');
    });
  });

  describe('All top-level commands present', () => {
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

    test.each(expectedCommands)('bash script includes %s command', async (command) => {
      const result = await runCommand('bun', ['run', 'src/index.ts', 'completions', 'bash']);
      expect(result.stdout).toContain(command);
    });
  });

  describe('Subcommands present', () => {
    const expectations = [
      { parent: 'address', subs: ['create', 'delete', 'info', 'list', 'set-default', 'update'] },
      { parent: 'auth', subs: ['login', 'logout', 'status'] },
      { parent: 'users', subs: ['add-funds', 'balances', 'change-password', 'create', 'pricing'] },
      { parent: 'domains', subs: ['check', 'info', 'list', 'lock', 'unlock', 'register', 'renew'] },
      { parent: 'dns', subs: ['add', 'list', 'rm', 'set', 'email'] },
    ];

    for (const { parent, subs } of expectations) {
      test(`bash script includes ${parent} subcommands`, async () => {
        const result = await runCommand('bun', ['run', 'src/index.ts', 'completions', 'bash']);

        for (const sub of subs) {
          expect(result.stdout).toContain(sub);
        }
      });
    }
  });
});
