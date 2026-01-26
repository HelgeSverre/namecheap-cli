import type { CmdNode } from './model.js';

export function renderBash(node: CmdNode): string {
  const commands = node.subcommands.map((c) => c.name).join(' ');

  const subcommandCases = node.subcommands
    .map((cmd) => {
      const subs = cmd.subcommands.map((s) => s.name).join(' ');
      if (!subs) return '';
      return `                ${cmd.name})
                    COMPREPLY=( $(compgen -W "${subs}" -- "\${cur}") )
                    ;;`;
    })
    .filter(Boolean)
    .join('\n');

  return `#!/bin/bash
# Namecheap CLI bash completion
# Generated automatically - do not edit manually

_namecheap_completions() {
    local cur prev words cword
    _init_completion || return

    local commands="${commands}"

    case "\${cword}" in
        1)
            COMPREPLY=( $(compgen -W "\${commands}" -- "\${cur}") )
            ;;
        2)
            case "\${prev}" in
${subcommandCases}
            esac
            ;;
    esac
}

complete -F _namecheap_completions namecheap
`;
}

export function renderZsh(node: CmdNode): string {
  const formatCommands = (cmds: CmdNode[]): string =>
    cmds.map((c) => `        '${c.name}:${(c.description || '').replace(/'/g, "''")}'`).join('\n');

  const topLevelCommands = formatCommands(node.subcommands);

  const subcommandArrays = node.subcommands
    .filter((cmd) => cmd.subcommands.length > 0)
    .map((cmd) => {
      const subs = formatCommands(cmd.subcommands);
      return `    ${cmd.name}_commands=(
${subs}
    )`;
    })
    .join('\n\n');

  const subcommandCases = node.subcommands
    .filter((cmd) => cmd.subcommands.length > 0)
    .map((cmd) => {
      return `                ${cmd.name})
                    _describe -t commands '${cmd.name} command' ${cmd.name}_commands
                    ;;`;
    })
    .join('\n');

  return `#compdef namecheap
# Namecheap CLI zsh completion
# Generated automatically - do not edit manually

_namecheap() {
    local -a commands
${subcommandArrays}

    commands=(
${topLevelCommands}
    )

    _arguments -C \\
        '1: :->command' \\
        '2: :->subcommand' \\
        '*::arg:->args'

    case $state in
        command)
            _describe -t commands 'namecheap command' commands
            ;;
        subcommand)
            case $words[2] in
${subcommandCases}
            esac
            ;;
    esac
}

_namecheap "$@"
`;
}

export function renderFish(node: CmdNode): string {
  const lines: string[] = [
    '# Namecheap CLI fish completion',
    '# Generated automatically - do not edit manually',
    '',
    '# Main commands',
  ];

  for (const cmd of node.subcommands) {
    const desc = (cmd.description || '').replace(/"/g, '\\"');
    lines.push(`complete -c namecheap -n "__fish_use_subcommand" -a "${cmd.name}" -d "${desc}"`);
  }

  for (const cmd of node.subcommands) {
    if (cmd.subcommands.length === 0) continue;

    lines.push('');
    lines.push(`# ${cmd.name.charAt(0).toUpperCase() + cmd.name.slice(1)} subcommands`);

    for (const sub of cmd.subcommands) {
      const desc = (sub.description || '').replace(/"/g, '\\"');
      lines.push(
        `complete -c namecheap -n "__fish_seen_subcommand_from ${cmd.name}" -a "${sub.name}" -d "${desc}"`,
      );
    }
  }

  return lines.join('\n') + '\n';
}
