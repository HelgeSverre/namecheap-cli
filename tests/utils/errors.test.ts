import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import {
  parseApiErrorCode,
  formatApiErrors,
  validateDomain,
  validateRecordType,
  validateIpAddress,
  ValidationError,
  CliError,
  AuthError,
  ApiError,
  handleError,
  requireAuth,
} from '../../src/utils/errors.js';

describe('parseApiErrorCode', () => {
  test('returns error info for known authentication error codes', () => {
    const result = parseApiErrorCode('1011102');
    expect(result).not.toBeNull();
    expect(result?.message).toBe('Invalid API Key');
    expect(result?.suggestion).toContain('namecheap auth login');
  });

  test('returns error info for known domain error codes', () => {
    const result = parseApiErrorCode('2019166');
    expect(result).not.toBeNull();
    expect(result?.message).toBe('Domain not found in your account');
  });

  test('returns error info for IP whitelist error', () => {
    const result = parseApiErrorCode('1011151');
    expect(result).not.toBeNull();
    expect(result?.message).toBe('Your IP address is not whitelisted');
    expect(result?.suggestion).toContain('whitelisted-ips');
  });

  test('returns error info for rate limit error', () => {
    const result = parseApiErrorCode('3031510');
    expect(result).not.toBeNull();
    expect(result?.message).toBe('Rate limit exceeded');
  });

  test('returns null for unknown error codes', () => {
    const result = parseApiErrorCode('9999999');
    expect(result).toBeNull();
  });

  test('returns null for empty string', () => {
    const result = parseApiErrorCode('');
    expect(result).toBeNull();
  });
});

describe('formatApiErrors', () => {
  test('formats single known error with suggestion', () => {
    const errors = [{ code: '1011102', message: 'Original API message' }];
    const result = formatApiErrors(errors);
    expect(result).toContain('Invalid API Key');
    expect(result).toContain('Suggestion:');
  });

  test('formats multiple errors', () => {
    const errors = [
      { code: '1011102', message: 'Error 1' },
      { code: '2019166', message: 'Error 2' },
    ];
    const result = formatApiErrors(errors);
    expect(result).toContain('Invalid API Key');
    expect(result).toContain('Domain not found');
  });

  test('formats unknown errors with code and original message', () => {
    const errors = [{ code: '9999999', message: 'Some unknown error' }];
    const result = formatApiErrors(errors);
    expect(result).toContain('[9999999]');
    expect(result).toContain('Some unknown error');
  });

  test('formats mixed known and unknown errors', () => {
    const errors = [
      { code: '1011102', message: 'Known error' },
      { code: '9999999', message: 'Unknown error' },
    ];
    const result = formatApiErrors(errors);
    expect(result).toContain('Invalid API Key');
    expect(result).toContain('[9999999]');
    expect(result).toContain('Unknown error');
  });

  test('returns empty string for empty errors array', () => {
    const result = formatApiErrors([]);
    expect(result).toBe('');
  });
});

describe('validateDomain', () => {
  test('accepts valid domain', () => {
    expect(() => {
      validateDomain('example.com');
    }).not.toThrow();
  });

  test('accepts valid subdomain', () => {
    expect(() => {
      validateDomain('sub.example.com');
    }).not.toThrow();
  });

  test('accepts valid multi-level subdomain', () => {
    expect(() => {
      validateDomain('a.b.c.example.com');
    }).not.toThrow();
  });

  test('accepts domain with hyphens', () => {
    expect(() => {
      validateDomain('my-domain.com');
    }).not.toThrow();
  });

  test('accepts domain with numbers', () => {
    expect(() => {
      validateDomain('domain123.com');
    }).not.toThrow();
  });

  test('throws for empty domain', () => {
    expect(() => {
      validateDomain('');
    }).toThrow(ValidationError);
    expect(() => {
      validateDomain('');
    }).toThrow('Domain name is required');
  });

  test('throws for domain without TLD', () => {
    expect(() => {
      validateDomain('example');
    }).toThrow(ValidationError);
    expect(() => {
      validateDomain('example');
    }).toThrow('Invalid domain format');
  });

  test('throws for domain with special characters', () => {
    expect(() => {
      validateDomain('exam!ple.com');
    }).toThrow(ValidationError);
  });

  test('throws for domain starting with hyphen', () => {
    expect(() => {
      validateDomain('-example.com');
    }).toThrow(ValidationError);
  });

  test('throws for domain ending with hyphen', () => {
    expect(() => {
      validateDomain('example-.com');
    }).toThrow(ValidationError);
  });

  test('throws for domain with spaces', () => {
    expect(() => {
      validateDomain('example .com');
    }).toThrow(ValidationError);
  });
});

describe('validateRecordType', () => {
  test('accepts valid A record type', () => {
    expect(() => {
      validateRecordType('A');
    }).not.toThrow();
  });

  test('accepts valid AAAA record type', () => {
    expect(() => {
      validateRecordType('AAAA');
    }).not.toThrow();
  });

  test('accepts valid CNAME record type', () => {
    expect(() => {
      validateRecordType('CNAME');
    }).not.toThrow();
  });

  test('accepts valid MX record type', () => {
    expect(() => {
      validateRecordType('MX');
    }).not.toThrow();
  });

  test('accepts valid TXT record type', () => {
    expect(() => {
      validateRecordType('TXT');
    }).not.toThrow();
  });

  test('accepts valid NS record type', () => {
    expect(() => {
      validateRecordType('NS');
    }).not.toThrow();
  });

  test('accepts lowercase record types', () => {
    expect(() => {
      validateRecordType('a');
    }).not.toThrow();
    expect(() => {
      validateRecordType('aaaa');
    }).not.toThrow();
    expect(() => {
      validateRecordType('cname');
    }).not.toThrow();
  });

  test('accepts mixed case record types', () => {
    expect(() => {
      validateRecordType('Cname');
    }).not.toThrow();
    expect(() => {
      validateRecordType('Mx');
    }).not.toThrow();
  });

  test('throws for invalid record type', () => {
    expect(() => {
      validateRecordType('INVALID');
    }).toThrow(ValidationError);
    expect(() => {
      validateRecordType('INVALID');
    }).toThrow('Invalid record type');
  });

  test('throws for empty record type', () => {
    expect(() => {
      validateRecordType('');
    }).toThrow(ValidationError);
  });
});

describe('validateIpAddress', () => {
  test('accepts valid IPv4 address', () => {
    expect(() => {
      validateIpAddress('1.2.3.4');
    }).not.toThrow();
  });

  test('accepts valid IPv4 with higher octets', () => {
    expect(() => {
      validateIpAddress('192.168.1.1');
    }).not.toThrow();
    expect(() => {
      validateIpAddress('255.255.255.255');
    }).not.toThrow();
  });

  test('accepts valid IPv4 with zeros', () => {
    expect(() => {
      validateIpAddress('0.0.0.0');
    }).not.toThrow();
  });

  test('accepts valid IPv6 address', () => {
    expect(() => {
      validateIpAddress('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    }).not.toThrow();
  });

  test('accepts IPv6 shorthand forms', () => {
    expect(() => {
      validateIpAddress('::1');
    }).not.toThrow();
    expect(() => {
      validateIpAddress('fe80::1');
    }).not.toThrow();
    expect(() => {
      validateIpAddress('::');
    }).not.toThrow();
  });

  test('throws for invalid IPv4 octets', () => {
    expect(() => {
      validateIpAddress('999.999.999.999');
    }).toThrow(ValidationError);
    expect(() => {
      validateIpAddress('256.1.1.1');
    }).toThrow(ValidationError);
  });

  test('throws for invalid IPv4 format', () => {
    expect(() => {
      validateIpAddress('1.2.3');
    }).toThrow(ValidationError);
    expect(() => {
      validateIpAddress('1.2.3.');
    }).toThrow(ValidationError);
    expect(() => {
      validateIpAddress('.1.2.3.4');
    }).toThrow(ValidationError);
  });

  test('throws for empty IP address', () => {
    expect(() => {
      validateIpAddress('');
    }).toThrow(ValidationError);
  });

  test('throws for hostname instead of IP', () => {
    expect(() => {
      validateIpAddress('example.com');
    }).toThrow(ValidationError);
  });

  test('throws for IP with text', () => {
    expect(() => {
      validateIpAddress('192.168.1.abc');
    }).toThrow(ValidationError);
  });
});

describe('CliError', () => {
  test('creates error with message', () => {
    const error = new CliError('Test error');
    expect(error.message).toBe('Test error');
    expect(error.name).toBe('CliError');
  });

  test('has default exit code of 1', () => {
    const error = new CliError('Test error');
    expect(error.exitCode).toBe(1);
  });

  test('accepts custom exit code', () => {
    const error = new CliError('Test error', 2);
    expect(error.exitCode).toBe(2);
  });

  test('accepts suggestion', () => {
    const error = new CliError('Test error', 1, 'Try this instead');
    expect(error.suggestion).toBe('Try this instead');
  });

  test('is instanceof Error', () => {
    const error = new CliError('Test');
    expect(error instanceof Error).toBe(true);
  });
});

describe('AuthError', () => {
  test('creates error with default message', () => {
    const error = new AuthError();
    expect(error.message).toContain('Not authenticated');
    expect(error.message).toContain('namecheap auth login');
  });

  test('accepts custom message', () => {
    const error = new AuthError('Custom auth error');
    expect(error.message).toBe('Custom auth error');
  });

  test('has exit code of 1', () => {
    const error = new AuthError();
    expect(error.exitCode).toBe(1);
  });

  test('has suggestion to login', () => {
    const error = new AuthError();
    expect(error.suggestion).toContain('namecheap auth login');
  });

  test('is instanceof CliError', () => {
    const error = new AuthError();
    expect(error instanceof CliError).toBe(true);
  });
});

describe('ApiError', () => {
  test('creates error with message', () => {
    const error = new ApiError('API failed');
    expect(error.message).toBe('API failed');
    expect(error.name).toBe('ApiError');
  });

  test('accepts error code', () => {
    const error = new ApiError('API failed', '1011102');
    expect(error.code).toBe('1011102');
  });

  test('accepts suggestion', () => {
    const error = new ApiError('API failed', '1011102', 'Check credentials');
    expect(error.suggestion).toBe('Check credentials');
  });

  test('has exit code of 1', () => {
    const error = new ApiError('API failed');
    expect(error.exitCode).toBe(1);
  });

  test('is instanceof CliError', () => {
    const error = new ApiError('API failed');
    expect(error instanceof CliError).toBe(true);
  });
});

describe('ValidationError', () => {
  test('creates error with message', () => {
    const error = new ValidationError('Invalid input');
    expect(error.message).toBe('Invalid input');
    expect(error.name).toBe('ValidationError');
  });

  test('accepts suggestion', () => {
    const error = new ValidationError('Invalid input', 'Use valid format');
    expect(error.suggestion).toBe('Use valid format');
  });

  test('has exit code of 1', () => {
    const error = new ValidationError('Invalid');
    expect(error.exitCode).toBe(1);
  });

  test('is instanceof CliError', () => {
    const error = new ValidationError('Invalid');
    expect(error instanceof CliError).toBe(true);
  });
});

describe('handleError', () => {
  let originalExit: typeof process.exit;
  let originalError: typeof console.error;
  let exitCode: number | undefined;
  let errorLogs: string[];

  beforeEach(() => {
    originalExit = process.exit;
    originalError = console.error;
    exitCode = undefined;
    errorLogs = [];

    // Mock process.exit to capture exit code instead of actually exiting
    process.exit = ((code?: number) => {
      exitCode = code;
      throw new Error(`process.exit(${code})`);
    }) as typeof process.exit;

    // Mock console.error to capture output
    console.error = (...args: unknown[]) => {
      errorLogs.push(args.map(String).join(' '));
    };
  });

  afterEach(() => {
    process.exit = originalExit;
    console.error = originalError;
  });

  test('handles CliError', () => {
    const error = new CliError('Test CLI error', 2);

    try {
      handleError(error);
    } catch (_e) {
      // Expected to throw due to mocked process.exit
    }

    expect(exitCode).toBe(2);
    expect(errorLogs.some((log) => log.includes('Test CLI error'))).toBe(true);
  });

  test('handles CliError with suggestion', () => {
    const error = new CliError('Test error', 1, 'Try this');

    try {
      handleError(error);
    } catch (_e) {
      // Expected to throw due to mocked process.exit
    }

    expect(exitCode).toBe(1);
    expect(errorLogs.some((log) => log.includes('Try this'))).toBe(true);
  });

  test('handles authentication errors', () => {
    const error = new Error('No credentials found');

    try {
      handleError(error);
    } catch (_e) {
      // Expected to throw due to mocked process.exit
    }

    expect(exitCode).toBe(1);
    expect(errorLogs.some((log) => log.includes('Not authenticated'))).toBe(true);
    expect(errorLogs.some((log) => log.includes('namecheap auth login'))).toBe(true);
  });

  test('handles "not authenticated" message', () => {
    const error = new Error('User not authenticated');

    try {
      handleError(error);
    } catch (_e) {
      // Expected to throw due to mocked process.exit
    }

    expect(exitCode).toBe(1);
    expect(errorLogs.some((log) => log.includes('Not authenticated'))).toBe(true);
  });

  test('handles API error with known error code', () => {
    const error = new Error('API Error:\n[1011102] Invalid API Key');

    try {
      handleError(error);
    } catch (_e) {
      // Expected to throw due to mocked process.exit
    }

    expect(exitCode).toBe(1);
    expect(errorLogs.some((log) => log.includes('API Error'))).toBe(true);
    expect(errorLogs.some((log) => log.includes('Invalid API Key'))).toBe(true);
  });

  test('handles API error with unknown error code', () => {
    const error = new Error('API Error:\n[9999999] Unknown error message');

    try {
      handleError(error);
    } catch (_e) {
      // Expected to throw due to mocked process.exit
    }

    expect(exitCode).toBe(1);
    expect(errorLogs.some((log) => log.includes('[9999999]'))).toBe(true);
    expect(errorLogs.some((log) => log.includes('Unknown error message'))).toBe(true);
  });

  test('handles API error without error codes', () => {
    const error = new Error('API Error:\nSome generic error');

    try {
      handleError(error);
    } catch (_e) {
      // Expected to throw due to mocked process.exit
    }

    expect(exitCode).toBe(1);
    expect(errorLogs.some((log) => log.includes('generic error'))).toBe(true);
  });

  test('handles network errors', () => {
    const error = new Error('fetch failed');

    try {
      handleError(error);
    } catch (_e) {
      // Expected to throw due to mocked process.exit
    }

    expect(exitCode).toBe(1);
    expect(errorLogs.some((log) => log.includes('Network error'))).toBe(true);
  });

  test('handles ENOTFOUND errors', () => {
    const error = new Error('ENOTFOUND api.namecheap.com');

    try {
      handleError(error);
    } catch (_e) {
      // Expected to throw due to mocked process.exit
    }

    expect(exitCode).toBe(1);
    expect(errorLogs.some((log) => log.includes('Network error'))).toBe(true);
  });

  test('handles HTTP 401 error', () => {
    const error = new Error('HTTP error: 401 Unauthorized');

    try {
      handleError(error);
    } catch (_e) {
      // Expected to throw due to mocked process.exit
    }

    expect(exitCode).toBe(1);
    expect(errorLogs.some((log) => log.includes('HTTP 401'))).toBe(true);
    expect(errorLogs.some((log) => log.includes('credentials'))).toBe(true);
  });

  test('handles HTTP 403 error', () => {
    const error = new Error('HTTP error: 403 Forbidden');

    try {
      handleError(error);
    } catch (_e) {
      // Expected to throw due to mocked process.exit
    }

    expect(exitCode).toBe(1);
    expect(errorLogs.some((log) => log.includes('HTTP 403'))).toBe(true);
  });

  test('handles HTTP 429 error', () => {
    const error = new Error('HTTP error: 429 Too Many Requests');

    try {
      handleError(error);
    } catch (_e) {
      // Expected to throw due to mocked process.exit
    }

    expect(exitCode).toBe(1);
    expect(errorLogs.some((log) => log.includes('HTTP 429'))).toBe(true);
    expect(errorLogs.some((log) => log.includes('Rate limited'))).toBe(true);
  });

  test('handles HTTP 500 error', () => {
    const error = new Error('HTTP error: 500 Internal Server Error');

    try {
      handleError(error);
    } catch (_e) {
      // Expected to throw due to mocked process.exit
    }

    expect(exitCode).toBe(1);
    expect(errorLogs.some((log) => log.includes('HTTP 500'))).toBe(true);
    expect(errorLogs.some((log) => log.includes('Server error'))).toBe(true);
  });

  test('handles generic Error', () => {
    const error = new Error('Something went wrong');

    try {
      handleError(error);
    } catch (_e) {
      // Expected to throw due to mocked process.exit
    }

    expect(exitCode).toBe(1);
    expect(errorLogs.some((log) => log.includes('Something went wrong'))).toBe(true);
  });

  test('handles non-Error objects', () => {
    try {
      handleError('string error');
    } catch (_e) {
      // Expected to throw due to mocked process.exit
    }

    expect(exitCode).toBe(1);
    expect(errorLogs.some((log) => log.includes('unexpected error'))).toBe(true);
  });

  test('handles null/undefined', () => {
    try {
      handleError(null);
    } catch (_e) {
      // Expected to throw due to mocked process.exit
    }

    expect(exitCode).toBe(1);
    expect(errorLogs.some((log) => log.includes('unexpected error'))).toBe(true);
  });
});

describe('requireAuth', () => {
  test('is a function', () => {
    expect(typeof requireAuth).toBe('function');
  });

  test('does not throw', () => {
    expect(() => {
      requireAuth();
    }).not.toThrow();
  });
});
