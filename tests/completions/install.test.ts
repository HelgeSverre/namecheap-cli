import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  detectShell,
  getCompletionPath,
  getPostInstallInstructions,
  installCompletion,
  uninstallCompletion,
} from '../../src/completions/install';

describe('completions/install', () => {
  describe('detectShell', () => {
    const originalShell = process.env.SHELL;

    afterEach(() => {
      if (originalShell !== undefined) {
        process.env.SHELL = originalShell;
      } else {
        delete process.env.SHELL;
      }
    });

    test('detects bash', () => {
      process.env.SHELL = '/bin/bash';
      expect(detectShell()).toBe('bash');
    });

    test('detects zsh', () => {
      process.env.SHELL = '/bin/zsh';
      expect(detectShell()).toBe('zsh');
    });

    test('detects fish', () => {
      process.env.SHELL = '/usr/local/bin/fish';
      expect(detectShell()).toBe('fish');
    });

    test('returns null for unknown shell', () => {
      process.env.SHELL = '/bin/unknown';
      expect(detectShell()).toBeNull();
    });

    test('returns null when SHELL is empty', () => {
      process.env.SHELL = '';
      expect(detectShell()).toBeNull();
    });
  });

  describe('getCompletionPath', () => {
    test('returns correct path for bash', () => {
      const result = getCompletionPath('bash');
      expect(result).toContain('.local/share/bash-completion/completions/namecheap');
    });

    test('returns correct path for zsh', () => {
      const result = getCompletionPath('zsh');
      expect(result).toContain('.zsh/completions/_namecheap');
    });

    test('returns correct path for fish', () => {
      const result = getCompletionPath('fish');
      expect(result).toContain('.config/fish/completions/namecheap.fish');
    });
  });

  describe('getPostInstallInstructions', () => {
    test('returns instructions for bash', () => {
      const instructions = getPostInstallInstructions('bash');
      expect(instructions.some((l) => l.includes('bashrc'))).toBe(true);
    });

    test('returns instructions for zsh', () => {
      const instructions = getPostInstallInstructions('zsh');
      expect(instructions.some((l) => l.includes('zshrc'))).toBe(true);
      expect(instructions.some((l) => l.includes('fpath'))).toBe(true);
    });

    test('returns instructions for fish', () => {
      const instructions = getPostInstallInstructions('fish');
      expect(instructions.some((l) => l.includes('auto-loaded'))).toBe(true);
    });
  });

  describe('installCompletion', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'namecheap-test-'));
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    test('dry run returns what would be done', () => {
      const result = installCompletion('bash', 'test content', { dryRun: true });

      expect(result.success).toBe(true);
      expect(result.path).toBeDefined();
      expect(result.instructions).toBeDefined();
      expect(result.instructions?.some((l) => l.includes('Would'))).toBe(true);
    });

    test('succeeds with force when file exists', () => {
      const result = installCompletion('bash', 'test content', { force: true });

      expect(result.success).toBe(true);
      expect(result.path).toBeDefined();
    });
  });

  describe('uninstallCompletion', () => {
    test('handles non-existent file gracefully', () => {
      const bashPath = getCompletionPath('bash');
      const fileExists = fs.existsSync(bashPath);

      const result = uninstallCompletion('bash');

      expect(result.success).toBe(true);
      if (!fileExists) {
        expect(result.instructions?.some((l) => l.includes('does not exist'))).toBe(true);
      }
    });
  });
});
