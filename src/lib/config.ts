import Conf from 'conf';
import type { ApiCredentials } from './api/types.js';

interface ConfigSchema {
  credentials?: ApiCredentials;
  sandbox: boolean;
  defaultOutput: 'table' | 'json';
}

const config = new Conf<ConfigSchema>({
  projectName: 'namecheap-cli',
  schema: {
    credentials: {
      type: 'object',
      properties: {
        apiUser: { type: 'string' },
        apiKey: { type: 'string' },
        userName: { type: 'string' },
        clientIp: { type: 'string' },
      },
    },
    sandbox: {
      type: 'boolean',
      default: false,
    },
    defaultOutput: {
      type: 'string',
      enum: ['table', 'json'],
      default: 'table',
    },
  },
});

export function getCredentials(): ApiCredentials | undefined {
  return config.get('credentials');
}

export function setCredentials(credentials: ApiCredentials): void {
  config.set('credentials', credentials);
}

export function clearCredentials(): void {
  config.delete('credentials');
}

export function isAuthenticated(): boolean {
  const creds = getCredentials();
  return !!(creds?.apiUser && creds?.apiKey && creds?.userName && creds?.clientIp);
}

export function isSandboxMode(): boolean {
  return config.get('sandbox', false);
}

export function setSandboxMode(enabled: boolean): void {
  config.set('sandbox', enabled);
}

export function getDefaultOutput(): 'table' | 'json' {
  return config.get('defaultOutput', 'table');
}

export function setDefaultOutput(format: 'table' | 'json'): void {
  config.set('defaultOutput', format);
}

export function getConfigPath(): string {
  return config.path;
}

export function getAllConfig(): ConfigSchema {
  return {
    credentials: config.get('credentials'),
    sandbox: config.get('sandbox', false),
    defaultOutput: config.get('defaultOutput', 'table'),
  };
}

export function setConfigValue(key: string, value: string | boolean): void {
  if (key === 'sandbox') {
    config.set('sandbox', value === 'true' || value === true);
  } else if (key === 'defaultOutput') {
    if (value === 'table' || value === 'json') {
      config.set('defaultOutput', value);
    } else {
      throw new Error('Invalid output format. Use "table" or "json".');
    }
  } else {
    throw new Error(`Unknown config key: ${key}`);
  }
}

export function getConfigValue(key: string): string | boolean | undefined {
  if (key === 'sandbox') {
    return config.get('sandbox', false);
  } else if (key === 'defaultOutput') {
    return config.get('defaultOutput', 'table');
  } else if (key === 'credentials.apiUser') {
    return config.get('credentials')?.apiUser;
  } else if (key === 'credentials.userName') {
    return config.get('credentials')?.userName;
  } else if (key === 'credentials.clientIp') {
    return config.get('credentials')?.clientIp;
  }
  throw new Error(`Unknown config key: ${key}`);
}

export { config };
