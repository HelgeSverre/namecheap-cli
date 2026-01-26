import { describe, expect, test } from 'bun:test';
import { Command } from 'commander';
import { commandToNode, getAllCommands, getSubcommands } from '../../src/completions/model';

describe('completions/model', () => {
  describe('commandToNode', () => {
    test('extracts basic command info', () => {
      const program = new Command('test').description('Test program').version('1.0.0');

      const node = commandToNode(program);

      expect(node.name).toBe('test');
      expect(node.description).toBe('Test program');
      expect(node.subcommands).toEqual([]);
    });

    test('extracts subcommands', () => {
      const program = new Command('test');
      program.addCommand(new Command('foo').description('Foo command'));
      program.addCommand(new Command('bar').description('Bar command'));

      const node = commandToNode(program);

      expect(node.subcommands).toHaveLength(2);
      expect(node.subcommands[0]!.name).toBe('bar');
      expect(node.subcommands[0]!.description).toBe('Bar command');
      expect(node.subcommands[1]!.name).toBe('foo');
      expect(node.subcommands[1]!.description).toBe('Foo command');
    });

    test('extracts nested subcommands', () => {
      const program = new Command('test');
      const sub = new Command('parent').description('Parent');
      sub.addCommand(new Command('child').description('Child command'));
      program.addCommand(sub);

      const node = commandToNode(program);

      expect(node.subcommands[0]!.name).toBe('parent');
      expect(node.subcommands[0]!.subcommands).toHaveLength(1);
      expect(node.subcommands[0]!.subcommands[0]!.name).toBe('child');
    });

    test('extracts options', () => {
      const program = new Command('test')
        .option('-f, --force', 'Force operation')
        .option('--dry-run', 'Dry run mode');

      const node = commandToNode(program);

      expect(node.options).toHaveLength(2);
      expect(node.options[0]!.flags).toBe('-f, --force');
      expect(node.options[0]!.description).toBe('Force operation');
    });

    test('sorts subcommands alphabetically', () => {
      const program = new Command('test');
      program.addCommand(new Command('zebra'));
      program.addCommand(new Command('alpha'));
      program.addCommand(new Command('middle'));

      const node = commandToNode(program);

      expect(node.subcommands.map((c) => c.name)).toEqual(['alpha', 'middle', 'zebra']);
    });
  });

  describe('getAllCommands', () => {
    test('returns top-level command names', () => {
      const program = new Command('test');
      program.addCommand(new Command('foo'));
      program.addCommand(new Command('bar'));

      const node = commandToNode(program);
      const commands = getAllCommands(node);

      expect(commands).toEqual(['bar', 'foo']);
    });
  });

  describe('getSubcommands', () => {
    test('returns subcommands for a given command', () => {
      const program = new Command('test');
      const parent = new Command('parent');
      parent.addCommand(new Command('child1'));
      parent.addCommand(new Command('child2'));
      program.addCommand(parent);

      const node = commandToNode(program);
      const subs = getSubcommands(node, 'parent');

      expect(subs).toEqual(['child1', 'child2']);
    });

    test('returns empty array for nonexistent command', () => {
      const program = new Command('test');
      const node = commandToNode(program);

      expect(getSubcommands(node, 'nonexistent')).toEqual([]);
    });
  });
});
