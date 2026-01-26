import type { Command, Option } from 'commander';

export interface CmdNode {
  name: string;
  description?: string;
  aliases: string[];
  options: { flags: string; description?: string }[];
  subcommands: CmdNode[];
}

const optToModel = (o: Option): { flags: string; description?: string } => ({
  flags: o.flags,
  description: o.description,
});

export function commandToNode(cmd: Command): CmdNode {
  const subcommands = cmd.commands
    .filter((c) => !(c as unknown as { _hidden?: boolean })._hidden)
    .map(commandToNode)
    .sort((a, b) => a.name.localeCompare(b.name));

  const options = (cmd.options ?? []).map(optToModel);

  return {
    name: cmd.name(),
    description: cmd.description(),
    aliases: cmd.aliases?.() ?? [],
    options,
    subcommands,
  };
}

export function getAllCommands(node: CmdNode): string[] {
  return node.subcommands.map((c) => c.name);
}

export function getSubcommands(node: CmdNode, commandName: string): string[] {
  const cmd = node.subcommands.find((c) => c.name === commandName);
  return cmd ? cmd.subcommands.map((s) => s.name) : [];
}
