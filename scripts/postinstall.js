#!/usr/bin/env node

// Show a helpful message after npm install
const message = `
┌───────────────────────────────────────────────────────────┐
│                                                           │
│   ncli installed successfully!                           │
│                                                           │
│   Get started:                                            │
│     namecheap auth login                                  │
│                                                           │
│   Enable shell completions (bash/zsh/fish):               │
│     namecheap completions install                         │
│                                                           │
└───────────────────────────────────────────────────────────┘
`;

// Only show in TTY (not in CI or scripts)
if (process.stdout.isTTY) {
  console.log(message);
}
