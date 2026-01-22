import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { ApiCredentials } from './api/types.js';

interface ConfigSchema {
  credentials?: ApiCredentials;
  sandbox: boolean;
  defaultOutput: 'table' | 'json';
}

const CONFIG_DIR = join(homedir(), '.config', 'namecheap-cli');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

const DEFAULT_CONFIG: ConfigSchema = {
  sandbox: false,
  defaultOutput: 'table',
};

function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function readConfig(): ConfigSchema {
  try {
    if (existsSync(CONFIG_FILE)) {
      const content = readFileSync(CONFIG_FILE, 'utf-8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(content) };
    }
  } catch {
    // Ignore parse errors, return defaults
  }
  return { ...DEFAULT_CONFIG };
}

function writeConfig(config: ConfigSchema): void {
  ensureConfigDir();
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
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
  return CONFIG_FILE;
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
