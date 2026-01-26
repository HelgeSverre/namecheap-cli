import { describe, expect, test } from 'bun:test';
import { Command } from 'commander';
import { commandToNode } from '../../src/completions/model';
import { renderBash, renderFish, renderZsh } from '../../src/completions/renderers';

function createTestProgram() {
  const program = new Command('namecheap').description('Test CLI');

  const auth = new Command('auth').description('Manage authentication');
  auth.addCommand(new Command('login').description('Log in'));
  auth.addCommand(new Command('logout').description('Log out'));
  program.addCommand(auth);

  const domains = new Command('domains').description('Manage domains');
  domains.addCommand(new Command('list').description('List domains'));
  domains.addCommand(new Command('info').description('Get domain info'));
  program.addCommand(domains);

  return program;
}

describe('completions/renderers', () => {
  describe('renderBash', () => {
    test('generates valid bash completion script', () => {
      const program = createTestProgram();
      const node = commandToNode(program);
      const script = renderBash(node);

      expect(script).toContain('#!/bin/bash');
      expect(script).toContain('_namecheap_completions()');
      expect(script).toContain('complete -F _namecheap_completions namecheap');
      expect(script).toContain('auth domains');
      expect(script).toContain('login logout');
      expect(script).toContain('info list');
    });

    test('includes all commands in completion list', () => {
      const program = createTestProgram();
      const node = commandToNode(program);
      const script = renderBash(node);

      expect(script).toContain('auth)');
      expect(script).toContain('domains)');
    });
  });

  describe('renderZsh', () => {
    test('generates valid zsh completion script', () => {
      const program = createTestProgram();
      const node = commandToNode(program);
      const script = renderZsh(node);

      expect(script).toContain('#compdef namecheap');
      expect(script).toContain('_namecheap()');
      expect(script).toContain("'auth:Manage authentication'");
      expect(script).toContain("'domains:Manage domains'");
      expect(script).toContain('_namecheap "$@"');
    });

    test('includes subcommand arrays', () => {
      const program = createTestProgram();
      const node = commandToNode(program);
      const script = renderZsh(node);

      expect(script).toContain('auth_commands=(');
      expect(script).toContain('domains_commands=(');
      expect(script).toContain("'login:Log in'");
      expect(script).toContain("'list:List domains'");
    });
  });

  describe('renderFish', () => {
    test('generates valid fish completion script', () => {
      const program = createTestProgram();
      const node = commandToNode(program);
      const script = renderFish(node);

      expect(script).toContain('# Namecheap CLI fish completion');
      expect(script).toContain('complete -c namecheap -n "__fish_use_subcommand"');
      expect(script).toContain('-a "auth"');
      expect(script).toContain('-d "Manage authentication"');
    });

    test('includes subcommand completions', () => {
      const program = createTestProgram();
      const node = commandToNode(program);
      const script = renderFish(node);

      expect(script).toContain('# Auth subcommands');
      expect(script).toContain('__fish_seen_subcommand_from auth');
      expect(script).toContain('-a "login"');
      expect(script).toContain('-d "Log in"');
    });
  });
});
