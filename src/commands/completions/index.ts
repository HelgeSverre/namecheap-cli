import { Command } from 'commander';

const BASH_COMPLETION = `#!/bin/bash
# Namecheap CLI bash completion

_namecheap_completions() {
    local cur prev words cword
    _init_completion || return

    local commands="auth domains dns ns config users whoisguard"
    local auth_commands="login logout status"
    local domains_commands="list info check register renew reactivate lock contacts"
    local dns_commands="list add rm set email"
    local ns_commands="list set reset create delete info update"
    local config_commands="get set list path"
    local users_commands="balances pricing"
    local whoisguard_commands="list enable disable allot unallot renew"

    case "\${cword}" in
        1)
            COMPREPLY=( $(compgen -W "\${commands}" -- "\${cur}") )
            ;;
        2)
            case "\${prev}" in
                auth)
                    COMPREPLY=( $(compgen -W "\${auth_commands}" -- "\${cur}") )
                    ;;
                domains)
                    COMPREPLY=( $(compgen -W "\${domains_commands}" -- "\${cur}") )
                    ;;
                dns)
                    COMPREPLY=( $(compgen -W "\${dns_commands}" -- "\${cur}") )
                    ;;
                ns)
                    COMPREPLY=( $(compgen -W "\${ns_commands}" -- "\${cur}") )
                    ;;
                config)
                    COMPREPLY=( $(compgen -W "\${config_commands}" -- "\${cur}") )
                    ;;
                users)
                    COMPREPLY=( $(compgen -W "\${users_commands}" -- "\${cur}") )
                    ;;
                whoisguard)
                    COMPREPLY=( $(compgen -W "\${whoisguard_commands}" -- "\${cur}") )
                    ;;
            esac
            ;;
    esac
}

complete -F _namecheap_completions namecheap
`;

const ZSH_COMPLETION = `#compdef namecheap
# Namecheap CLI zsh completion

_namecheap() {
    local -a commands
    local -a auth_commands
    local -a domains_commands
    local -a dns_commands
    local -a ns_commands
    local -a config_commands
    local -a users_commands
    local -a whoisguard_commands

    commands=(
        'auth:Manage authentication'
        'domains:Manage domains'
        'dns:Manage DNS records'
        'ns:Manage nameservers'
        'config:Manage configuration'
        'users:User account commands'
        'whoisguard:Manage WhoisGuard'
    )

    auth_commands=(
        'login:Authenticate with Namecheap API'
        'logout:Clear stored credentials'
        'status:Check authentication status'
    )

    domains_commands=(
        'list:List all domains'
        'info:Get domain information'
        'check:Check domain availability'
        'register:Register a new domain'
        'renew:Renew a domain'
        'reactivate:Reactivate an expired domain'
        'lock:Manage registrar lock'
        'contacts:Manage domain contacts'
    )

    dns_commands=(
        'list:List DNS records'
        'add:Add a DNS record'
        'rm:Remove a DNS record'
        'set:Update a DNS record'
        'email:Manage email forwarding'
    )

    ns_commands=(
        'list:List nameservers'
        'set:Set custom nameservers'
        'reset:Reset to default nameservers'
        'create:Create a child nameserver'
        'delete:Delete a child nameserver'
        'info:Get nameserver info'
        'update:Update a child nameserver'
    )

    config_commands=(
        'get:Get a config value'
        'set:Set a config value'
        'list:List all config values'
        'path:Show config file path'
    )

    users_commands=(
        'balances:Show account balance'
        'pricing:Get pricing information'
    )

    whoisguard_commands=(
        'list:List WhoisGuard subscriptions'
        'enable:Enable WhoisGuard'
        'disable:Disable WhoisGuard'
        'allot:Assign WhoisGuard to domain'
        'unallot:Remove WhoisGuard from domain'
        'renew:Renew WhoisGuard'
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
                auth)
                    _describe -t commands 'auth command' auth_commands
                    ;;
                domains)
                    _describe -t commands 'domains command' domains_commands
                    ;;
                dns)
                    _describe -t commands 'dns command' dns_commands
                    ;;
                ns)
                    _describe -t commands 'ns command' ns_commands
                    ;;
                config)
                    _describe -t commands 'config command' config_commands
                    ;;
                users)
                    _describe -t commands 'users command' users_commands
                    ;;
                whoisguard)
                    _describe -t commands 'whoisguard command' whoisguard_commands
                    ;;
            esac
            ;;
    esac
}

_namecheap "$@"
`;

const FISH_COMPLETION = `# Namecheap CLI fish completion

# Main commands
complete -c namecheap -n "__fish_use_subcommand" -a "auth" -d "Manage authentication"
complete -c namecheap -n "__fish_use_subcommand" -a "domains" -d "Manage domains"
complete -c namecheap -n "__fish_use_subcommand" -a "dns" -d "Manage DNS records"
complete -c namecheap -n "__fish_use_subcommand" -a "ns" -d "Manage nameservers"
complete -c namecheap -n "__fish_use_subcommand" -a "config" -d "Manage configuration"
complete -c namecheap -n "__fish_use_subcommand" -a "users" -d "User account commands"
complete -c namecheap -n "__fish_use_subcommand" -a "whoisguard" -d "Manage WhoisGuard"

# Auth subcommands
complete -c namecheap -n "__fish_seen_subcommand_from auth" -a "login" -d "Authenticate with Namecheap API"
complete -c namecheap -n "__fish_seen_subcommand_from auth" -a "logout" -d "Clear stored credentials"
complete -c namecheap -n "__fish_seen_subcommand_from auth" -a "status" -d "Check authentication status"

# Domains subcommands
complete -c namecheap -n "__fish_seen_subcommand_from domains" -a "list" -d "List all domains"
complete -c namecheap -n "__fish_seen_subcommand_from domains" -a "info" -d "Get domain information"
complete -c namecheap -n "__fish_seen_subcommand_from domains" -a "check" -d "Check domain availability"
complete -c namecheap -n "__fish_seen_subcommand_from domains" -a "register" -d "Register a new domain"
complete -c namecheap -n "__fish_seen_subcommand_from domains" -a "renew" -d "Renew a domain"
complete -c namecheap -n "__fish_seen_subcommand_from domains" -a "reactivate" -d "Reactivate an expired domain"
complete -c namecheap -n "__fish_seen_subcommand_from domains" -a "lock" -d "Manage registrar lock"
complete -c namecheap -n "__fish_seen_subcommand_from domains" -a "contacts" -d "Manage domain contacts"

# DNS subcommands
complete -c namecheap -n "__fish_seen_subcommand_from dns" -a "list" -d "List DNS records"
complete -c namecheap -n "__fish_seen_subcommand_from dns" -a "add" -d "Add a DNS record"
complete -c namecheap -n "__fish_seen_subcommand_from dns" -a "rm" -d "Remove a DNS record"
complete -c namecheap -n "__fish_seen_subcommand_from dns" -a "set" -d "Update a DNS record"
complete -c namecheap -n "__fish_seen_subcommand_from dns" -a "email" -d "Manage email forwarding"

# NS subcommands
complete -c namecheap -n "__fish_seen_subcommand_from ns" -a "list" -d "List nameservers"
complete -c namecheap -n "__fish_seen_subcommand_from ns" -a "set" -d "Set custom nameservers"
complete -c namecheap -n "__fish_seen_subcommand_from ns" -a "reset" -d "Reset to default nameservers"
complete -c namecheap -n "__fish_seen_subcommand_from ns" -a "create" -d "Create a child nameserver"
complete -c namecheap -n "__fish_seen_subcommand_from ns" -a "delete" -d "Delete a child nameserver"
complete -c namecheap -n "__fish_seen_subcommand_from ns" -a "info" -d "Get nameserver info"
complete -c namecheap -n "__fish_seen_subcommand_from ns" -a "update" -d "Update a child nameserver"

# Config subcommands
complete -c namecheap -n "__fish_seen_subcommand_from config" -a "get" -d "Get a config value"
complete -c namecheap -n "__fish_seen_subcommand_from config" -a "set" -d "Set a config value"
complete -c namecheap -n "__fish_seen_subcommand_from config" -a "list" -d "List all config values"
complete -c namecheap -n "__fish_seen_subcommand_from config" -a "path" -d "Show config file path"

# Users subcommands
complete -c namecheap -n "__fish_seen_subcommand_from users" -a "balances" -d "Show account balance"
complete -c namecheap -n "__fish_seen_subcommand_from users" -a "pricing" -d "Get pricing information"

# WhoisGuard subcommands
complete -c namecheap -n "__fish_seen_subcommand_from whoisguard" -a "list" -d "List WhoisGuard subscriptions"
complete -c namecheap -n "__fish_seen_subcommand_from whoisguard" -a "enable" -d "Enable WhoisGuard"
complete -c namecheap -n "__fish_seen_subcommand_from whoisguard" -a "disable" -d "Disable WhoisGuard"
complete -c namecheap -n "__fish_seen_subcommand_from whoisguard" -a "allot" -d "Assign WhoisGuard to domain"
complete -c namecheap -n "__fish_seen_subcommand_from whoisguard" -a "unallot" -d "Remove WhoisGuard from domain"
complete -c namecheap -n "__fish_seen_subcommand_from whoisguard" -a "renew" -d "Renew WhoisGuard"
`;

export const completionsCommand = new Command('completions')
  .description('Generate shell completion scripts')
  .argument('<shell>', 'Shell type: bash, zsh, or fish')
  .action((shell: string) => {
    const shellLower = shell.toLowerCase();

    switch (shellLower) {
      case 'bash':
        console.log(BASH_COMPLETION);
        break;
      case 'zsh':
        console.log(ZSH_COMPLETION);
        break;
      case 'fish':
        console.log(FISH_COMPLETION);
        break;
      default:
        console.error(`Unknown shell: ${shell}`);
        console.error('Supported shells: bash, zsh, fish');
        process.exit(1);
    }
  });
