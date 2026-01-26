#!/bin/bash

# Record Asciinema demos for namecheap-cli
# Prerequisites:
#   - asciinema installed: brew install asciinema
#   - namecheap-cli installed and configured
#   - Sandbox mode enabled for safe demos

set -e

DEMO_DIR="website/public/demos"
mkdir -p "$DEMO_DIR"

echo "🎬 Recording namecheap-cli demos..."
echo ""

# Helper to record a scripted demo
# Uses `script` command to simulate typing for consistent demos
record_demo() {
  local name=$1
  local script_file=$2
  local output="$DEMO_DIR/$name.cast"

  echo "📹 Recording: $name"

  # Record with asciinema
  asciinema rec \
    --cols 80 \
    --rows 24 \
    --idle-time-limit 2 \
    --command "bash $script_file" \
    --overwrite \
    "$output"

  echo "   ✓ Saved to $output"
  echo ""
}

# Create temporary script files for each demo scenario
create_demo_scripts() {
  local scripts_dir=$(mktemp -d)

  # Overview demo
  cat > "$scripts_dir/overview.sh" << 'EOF'
#!/bin/bash
# Simulated typing effect
type_cmd() {
  for ((i=0; i<${#1}; i++)); do
    echo -n "${1:$i:1}"
    sleep 0.05
  done
  echo ""
  sleep 0.3
}

clear
sleep 0.5

echo -e "\033[90m# Authenticate with your Namecheap API key\033[0m"
type_cmd "namecheap auth login"
namecheap auth status 2>/dev/null || echo -e "\033[32m✓\033[0m Authenticated as demo-user"
sleep 1

echo ""
echo -e "\033[90m# List all your domains\033[0m"
type_cmd "namecheap domains list"
namecheap domains list 2>/dev/null || cat << 'TABLE'
┌──────────────────┬────────────┬───────────┐
│ Domain           │ Expires    │ AutoRenew │
├──────────────────┼────────────┼───────────┤
│ example.com      │ 2025-12-01 │ enabled   │
│ mysite.dev       │ 2025-06-15 │ enabled   │
│ coolproject.io   │ 2026-03-20 │ enabled   │
└──────────────────┴────────────┴───────────┘
TABLE
sleep 1

echo ""
echo -e "\033[90m# Check domain availability\033[0m"
type_cmd "namecheap domains check awesome-startup.com"
echo -e "\033[32m✓\033[0m awesome-startup.com is available!"
sleep 2
EOF

  # Domains demo
  cat > "$scripts_dir/domains.sh" << 'EOF'
#!/bin/bash
type_cmd() {
  for ((i=0; i<${#1}; i++)); do
    echo -n "${1:$i:1}"
    sleep 0.04
  done
  echo ""
  sleep 0.3
}

clear
sleep 0.5

echo -e "\033[90m# View all domain commands\033[0m"
type_cmd "namecheap domains --help"
namecheap domains --help 2>/dev/null || cat << 'HELP'
Usage: namecheap domains [command]

Manage your Namecheap domains

Commands:
  list              List all domains
  info <domain>     Get domain information
  check <domain>    Check domain availability
  register <domain> Register a new domain
  renew <domain>    Renew a domain
  lock <domain>     Enable registrar lock
  unlock <domain>   Disable registrar lock
  contacts <domain> Manage domain contacts

Options:
  -h, --help   Show help
  --json       Output as JSON
HELP
sleep 1.5

echo ""
echo -e "\033[90m# List domains with JSON output\033[0m"
type_cmd "namecheap domains list --json"
echo '[{"domain":"example.com","expires":"2025-12-01","autoRenew":true}]'
sleep 1.5

echo ""
echo -e "\033[90m# Get detailed domain info\033[0m"
type_cmd "namecheap domains info example.com"
cat << 'INFO'
Domain: example.com
Status: Active
Created: 2020-12-01
Expires: 2025-12-01
Auto-Renew: Enabled
Registrar Lock: Enabled
WhoisGuard: Enabled
INFO
sleep 2
EOF

  # DNS demo
  cat > "$scripts_dir/dns.sh" << 'EOF'
#!/bin/bash
type_cmd() {
  for ((i=0; i<${#1}; i++)); do
    echo -n "${1:$i:1}"
    sleep 0.04
  done
  echo ""
  sleep 0.3
}

clear
sleep 0.5

echo -e "\033[90m# List DNS records for a domain\033[0m"
type_cmd "namecheap dns list example.com"
cat << 'TABLE'
┌──────┬────────┬─────────────────────┬─────┐
│ Type │ Name   │ Value               │ TTL │
├──────┼────────┼─────────────────────┼─────┤
│ A    │ @      │ 192.168.1.1         │ 300 │
│ CNAME│ www    │ example.com         │ 300 │
│ MX   │ @      │ mail.example.com    │ 300 │
│ TXT  │ @      │ v=spf1 include:... │ 300 │
└──────┴────────┴─────────────────────┴─────┘
TABLE
sleep 1.5

echo ""
echo -e "\033[90m# Add a new A record\033[0m"
type_cmd "namecheap dns add example.com --type A --name blog --value 192.168.1.2"
echo -e "\033[32m✓\033[0m A record added: blog → 192.168.1.2"
sleep 1

echo ""
echo -e "\033[90m# Add a CNAME record\033[0m"
type_cmd "namecheap dns add example.com --type CNAME --name api --value api.vercel.app"
echo -e "\033[32m✓\033[0m CNAME record added: api → api.vercel.app"
sleep 1.5

echo ""
echo -e "\033[90m# Remove a record\033[0m"
type_cmd "namecheap dns rm example.com --name blog --type A"
echo -e "\033[32m✓\033[0m Record removed"
sleep 2
EOF

  # Nameservers demo
  cat > "$scripts_dir/ns.sh" << 'EOF'
#!/bin/bash
type_cmd() {
  for ((i=0; i<${#1}; i++)); do
    echo -n "${1:$i:1}"
    sleep 0.04
  done
  echo ""
  sleep 0.3
}

clear
sleep 0.5

echo -e "\033[90m# View current nameservers\033[0m"
type_cmd "namecheap ns list example.com"
cat << 'NS'
Current nameservers for example.com:
  • dns1.registrar-servers.com
  • dns2.registrar-servers.com
NS
sleep 1.5

echo ""
echo -e "\033[90m# Set custom nameservers (Cloudflare)\033[0m"
type_cmd "namecheap ns set example.com ns1.cloudflare.com ns2.cloudflare.com"
echo -e "\033[32m✓\033[0m Nameservers updated for example.com"
sleep 1

echo ""
echo -e "\033[90m# Reset to Namecheap defaults\033[0m"
type_cmd "namecheap ns reset example.com"
echo -e "\033[32m✓\033[0m Nameservers reset to Namecheap defaults"
sleep 2
EOF

  # Auth demo
  cat > "$scripts_dir/auth.sh" << 'EOF'
#!/bin/bash
type_cmd() {
  for ((i=0; i<${#1}; i++)); do
    echo -n "${1:$i:1}"
    sleep 0.04
  done
  echo ""
  sleep 0.3
}

clear
sleep 0.5

echo -e "\033[90m# Check authentication status\033[0m"
type_cmd "namecheap auth status"
echo "Not authenticated"
sleep 1

echo ""
echo -e "\033[90m# Login with API credentials\033[0m"
type_cmd "namecheap auth login"
echo "? Namecheap username: helge"
sleep 0.5
echo "? API key: **********************"
sleep 0.5
echo "? Whitelisted IP: 192.168.1.100"
sleep 0.5
echo -e "\033[32m✓\033[0m Successfully authenticated as helge"
sleep 1.5

echo ""
echo -e "\033[90m# Verify authentication\033[0m"
type_cmd "namecheap auth status"
cat << 'STATUS'
Authenticated: Yes
Username: helge
Environment: Production
STATUS
sleep 2
EOF

  # WhoisGuard demo
  cat > "$scripts_dir/whoisguard.sh" << 'EOF'
#!/bin/bash
type_cmd() {
  for ((i=0; i<${#1}; i++)); do
    echo -n "${1:$i:1}"
    sleep 0.04
  done
  echo ""
  sleep 0.3
}

clear
sleep 0.5

echo -e "\033[90m# List WhoisGuard subscriptions\033[0m"
type_cmd "namecheap whoisguard list"
cat << 'TABLE'
┌────────────┬─────────────────┬──────────┐
│ ID         │ Domain          │ Status   │
├────────────┼─────────────────┼──────────┤
│ 12345      │ example.com     │ Enabled  │
│ 12346      │ mysite.dev      │ Disabled │
└────────────┴─────────────────┴──────────┘
TABLE
sleep 1.5

echo ""
echo -e "\033[90m# Enable WhoisGuard for a domain\033[0m"
type_cmd "namecheap whoisguard enable mysite.dev"
echo -e "\033[32m✓\033[0m WhoisGuard enabled for mysite.dev"
sleep 1.5

echo ""
echo -e "\033[90m# Disable WhoisGuard\033[0m"
type_cmd "namecheap whoisguard disable mysite.dev"
echo -e "\033[32m✓\033[0m WhoisGuard disabled for mysite.dev"
sleep 2
EOF

  # Config demo
  cat > "$scripts_dir/config.sh" << 'EOF'
#!/bin/bash
type_cmd() {
  for ((i=0; i<${#1}; i++)); do
    echo -n "${1:$i:1}"
    sleep 0.04
  done
  echo ""
  sleep 0.3
}

clear
sleep 0.5

echo -e "\033[90m# View current configuration\033[0m"
type_cmd "namecheap config list"
cat << 'CONFIG'
Configuration:
  sandbox: false
  output: table
CONFIG
sleep 1

echo ""
echo -e "\033[90m# Enable sandbox mode for testing\033[0m"
type_cmd "namecheap config set sandbox true"
echo -e "\033[32m✓\033[0m sandbox set to true"
sleep 1

echo ""
echo -e "\033[90m# Set default output format to JSON\033[0m"
type_cmd "namecheap config set output json"
echo -e "\033[32m✓\033[0m output set to json"
sleep 1

echo ""
echo -e "\033[90m# Show config file path\033[0m"
type_cmd "namecheap config path"
echo "/Users/helge/.config/namecheap-cli/config.json"
sleep 2
EOF

  echo "$scripts_dir"
}

# Main execution
main() {
  # Check if asciinema is installed
  if ! command -v asciinema &> /dev/null; then
    echo "❌ asciinema is not installed"
    echo "   Install with: brew install asciinema"
    exit 1
  fi

  # Create demo scripts
  SCRIPTS_DIR=$(create_demo_scripts)

  # Make scripts executable
  chmod +x "$SCRIPTS_DIR"/*.sh

  # Record each demo
  record_demo "overview" "$SCRIPTS_DIR/overview.sh"
  record_demo "domains" "$SCRIPTS_DIR/domains.sh"
  record_demo "dns" "$SCRIPTS_DIR/dns.sh"
  record_demo "ns" "$SCRIPTS_DIR/ns.sh"
  record_demo "auth" "$SCRIPTS_DIR/auth.sh"
  record_demo "whoisguard" "$SCRIPTS_DIR/whoisguard.sh"
  record_demo "config" "$SCRIPTS_DIR/config.sh"

  # Cleanup
  rm -rf "$SCRIPTS_DIR"

  echo "✅ All demos recorded!"
  echo ""
  echo "Files created in $DEMO_DIR:"
  ls -la "$DEMO_DIR"/*.cast
}

main "$@"
