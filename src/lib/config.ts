import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getHomeDir } from '../utils/home.js';
import type { ApiCredentials } from './api/types.js';

interface ConfigSchema {
  credentials?: ApiCredentials;
  sandbox: boolean;
  defaultOutput: 'table' | 'json';
}

/**
 * Directory holding the CLI's config file. `NAMECHEAP_CLI_CONFIG_DIR` overrides
 * the default `~/.config/namecheap-cli`. Resolved on every call so tests (and
 * users) can redirect it without re-importing the module.
 */
export function getConfigDir(): string {
  return process.env.NAMECHEAP_CLI_CONFIG_DIR || join(getHomeDir(), '.config', 'namecheap-cli');
}

function getConfigFile(): string {
  return join(getConfigDir(), 'config.json');
}

const DEFAULT_CONFIG: ConfigSchema = {
  sandbox: false,
  defaultOutput: 'table',
};

function ensureConfigDir(): void {
  const configDir = getConfigDir();
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }
}

function readConfig(): ConfigSchema {
  try {
    const configFile = getConfigFile();
    if (existsSync(configFile)) {
      const content = readFileSync(configFile, 'utf-8');
      const parsed = JSON.parse(content) as Partial<ConfigSchema>;
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch {
    // Ignore parse errors, return defaults
  }
  return { ...DEFAULT_CONFIG };
}

function writeConfig(config: ConfigSchema): void {
  ensureConfigDir();
  writeFileSync(getConfigFile(), JSON.stringify(config, null, 2), 'utf-8');
}

export function getCredentials(): ApiCredentials | undefined {
  return readConfig().credentials;
}

export function setCredentials(credentials: ApiCredentials): void {
  const config = readConfig();
  config.credentials = credentials;
  writeConfig(config);
}

export function clearCredentials(): void {
  const config = readConfig();
  delete config.credentials;
  writeConfig(config);
}

export function isAuthenticated(): boolean {
  const creds = getCredentials();
  return !!(creds?.apiUser && creds?.apiKey && creds?.userName && creds?.clientIp);
}

export function isSandboxMode(): boolean {
  return readConfig().sandbox;
}

export function setSandboxMode(enabled: boolean): void {
  const config = readConfig();
  config.sandbox = enabled;
  writeConfig(config);
}

export function getDefaultOutput(): 'table' | 'json' {
  return readConfig().defaultOutput;
}

export function setDefaultOutput(format: 'table' | 'json'): void {
  const config = readConfig();
  config.defaultOutput = format;
  writeConfig(config);
}

export function getConfigPath(): string {
  return getConfigFile();
}

export function getAllConfig(): ConfigSchema {
  return readConfig();
}

export function setConfigValue(key: string, value: string | boolean): void {
  const config = readConfig();

  if (key === 'sandbox') {
    config.sandbox = value === 'true' || value === true;
  } else if (key === 'defaultOutput') {
    if (value === 'table' || value === 'json') {
      config.defaultOutput = value;
    } else {
      throw new Error('Invalid output format. Use "table" or "json".');
    }
  } else {
    throw new Error(`Unknown config key: ${key}`);
  }

  writeConfig(config);
}

export function getConfigValue(key: string): string | boolean | undefined {
  const config = readConfig();

  if (key === 'sandbox') {
    return config.sandbox;
  } else if (key === 'defaultOutput') {
    return config.defaultOutput;
  } else if (key === 'credentials.apiUser') {
    return config.credentials?.apiUser;
  } else if (key === 'credentials.userName') {
    return config.credentials?.userName;
  } else if (key === 'credentials.clientIp') {
    return config.credentials?.clientIp;
  }
  throw new Error(`Unknown config key: ${key}`);
}
