import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import {
  getCredentials,
  setCredentials,
  clearCredentials,
  isAuthenticated,
  isSandboxMode,
  setSandboxMode,
  getDefaultOutput,
  setDefaultOutput,
  getConfigPath,
  getAllConfig,
  setConfigValue,
  getConfigValue,
  config,
} from '../../src/lib/config.js';

describe('config', () => {
  // Store original values to restore after tests
  let originalCredentials: ReturnType<typeof getCredentials>;
  let originalSandbox: boolean;
  let originalOutput: 'table' | 'json';

  beforeEach(() => {
    // Save original state
    originalCredentials = getCredentials();
    originalSandbox = isSandboxMode();
    originalOutput = getDefaultOutput();
  });

  afterEach(() => {
    // Restore original state
    if (originalCredentials) {
      setCredentials(originalCredentials);
    } else {
      clearCredentials();
    }
    setSandboxMode(originalSandbox);
    setDefaultOutput(originalOutput);
  });

  describe('credentials', () => {
    test('setCredentials and getCredentials work together', () => {
      const creds = {
        apiUser: 'testuser',
        apiKey: 'testkey',
        userName: 'testuser',
        clientIp: '127.0.0.1',
      };
      setCredentials(creds);
      const result = getCredentials();

      expect(result).toEqual(creds);
    });

    test('clearCredentials removes credentials', () => {
      setCredentials({
        apiUser: 'test',
        apiKey: 'test',
        userName: 'test',
        clientIp: '127.0.0.1',
      });
      clearCredentials();
      const result = getCredentials();

      expect(result).toBeUndefined();
    });
  });

  describe('isAuthenticated', () => {
    test('returns true when all credentials are set', () => {
      setCredentials({
        apiUser: 'user',
        apiKey: 'key',
        userName: 'user',
        clientIp: '1.2.3.4',
      });

      expect(isAuthenticated()).toBe(true);
    });

    test('returns false when credentials are missing', () => {
      clearCredentials();

      expect(isAuthenticated()).toBe(false);
    });

    test('returns false when credentials are incomplete', () => {
      // Set partial credentials by directly manipulating config
      config.set('credentials', {
        apiUser: 'user',
        apiKey: '',
        userName: 'user',
        clientIp: '1.2.3.4',
      } as any);

      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('sandbox mode', () => {
    test('setSandboxMode and isSandboxMode work together', () => {
      setSandboxMode(true);
      expect(isSandboxMode()).toBe(true);

      setSandboxMode(false);
      expect(isSandboxMode()).toBe(false);
    });

    test('defaults to false', () => {
      config.delete('sandbox');
      expect(isSandboxMode()).toBe(false);
    });
  });

  describe('default output', () => {
    test('setDefaultOutput and getDefaultOutput work together', () => {
      setDefaultOutput('json');
      expect(getDefaultOutput()).toBe('json');

      setDefaultOutput('table');
      expect(getDefaultOutput()).toBe('table');
    });

    test('defaults to table', () => {
      config.delete('defaultOutput');
      expect(getDefaultOutput()).toBe('table');
    });
  });

  describe('getConfigPath', () => {
    test('returns a string path', () => {
      const path = getConfigPath();
      expect(typeof path).toBe('string');
      expect(path.length).toBeGreaterThan(0);
    });
  });

  describe('getAllConfig', () => {
    test('returns config object with all keys', () => {
      const allConfig = getAllConfig();

      expect(allConfig).toHaveProperty('sandbox');
      expect(allConfig).toHaveProperty('defaultOutput');
      expect(allConfig).toHaveProperty('credentials');
    });

    test('returns current values', () => {
      setSandboxMode(true);
      setDefaultOutput('json');

      const allConfig = getAllConfig();
      expect(allConfig.sandbox).toBe(true);
      expect(allConfig.defaultOutput).toBe('json');
    });
  });

  describe('setConfigValue', () => {
    test('sets sandbox value with string "true"', () => {
      setConfigValue('sandbox', 'true');
      expect(isSandboxMode()).toBe(true);
    });

    test('sets sandbox value with string "false"', () => {
      setConfigValue('sandbox', 'false');
      expect(isSandboxMode()).toBe(false);
    });

    test('sets sandbox value with boolean', () => {
      setConfigValue('sandbox', true);
      expect(isSandboxMode()).toBe(true);
    });

    test('sets defaultOutput to json', () => {
      setConfigValue('defaultOutput', 'json');
      expect(getDefaultOutput()).toBe('json');
    });

    test('sets defaultOutput to table', () => {
      setConfigValue('defaultOutput', 'table');
      expect(getDefaultOutput()).toBe('table');
    });

    test('throws for invalid output format', () => {
      expect(() => {
        setConfigValue('defaultOutput', 'invalid');
      }).toThrow('Invalid output format');
    });

    test('throws for unknown config key', () => {
      expect(() => {
        setConfigValue('unknownKey', 'value');
      }).toThrow('Unknown config key');
    });
  });

  describe('getConfigValue', () => {
    test('gets sandbox value', () => {
      setSandboxMode(true);
      expect(getConfigValue('sandbox')).toBe(true);
    });

    test('gets defaultOutput value', () => {
      setDefaultOutput('json');
      expect(getConfigValue('defaultOutput')).toBe('json');
    });

    test('gets credentials.apiUser', () => {
      setCredentials({
        apiUser: 'myuser',
        apiKey: 'key',
        userName: 'user',
        clientIp: '1.2.3.4',
      });
      expect(getConfigValue('credentials.apiUser')).toBe('myuser');
    });

    test('gets credentials.userName', () => {
      setCredentials({
        apiUser: 'user',
        apiKey: 'key',
        userName: 'myusername',
        clientIp: '1.2.3.4',
      });
      expect(getConfigValue('credentials.userName')).toBe('myusername');
    });

    test('gets credentials.clientIp', () => {
      setCredentials({
        apiUser: 'user',
        apiKey: 'key',
        userName: 'user',
        clientIp: '192.168.1.1',
      });
      expect(getConfigValue('credentials.clientIp')).toBe('192.168.1.1');
    });

    test('throws for unknown config key', () => {
      expect(() => getConfigValue('unknownKey')).toThrow('Unknown config key');
    });
  });
});
