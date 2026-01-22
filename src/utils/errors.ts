import chalk from 'chalk';
import { isIP } from 'node:net';

// Namecheap API error code mapping
// Maps error codes to user-friendly messages and suggestions
export const API_ERROR_MAP: Record<string, { message: string; suggestion: string }> = {
  // Authentication errors (1011xxx)
  '1011102': {
    message: 'Invalid API Key',
    suggestion: 'Run "namecheap auth login" to re-authenticate',
  },
  '1011150': {
    message: 'API access is disabled for your account',
    suggestion: 'Enable API access at https://ap.www.namecheap.com/settings/tools/apiaccess/',
  },
  '1011151': {
    message: 'Your IP address is not whitelisted',
    suggestion:
      'Add your IP at https://ap.www.namecheap.com/settings/tools/apiaccess/whitelisted-ips',
  },
  '1011152': {
    message: 'Sandbox API access is disabled',
    suggestion:
      'Use production mode with "namecheap config set sandbox false" or enable sandbox access in your account',
  },
  '1011153': {
    message: 'Invalid username or API key',
    suggestion: 'Run "namecheap auth login" to re-authenticate with correct credentials',
  },

  // Domain errors (2019xxx, 2030xxx)
  '2019166': {
    message: 'Domain not found in your account',
    suggestion: 'Check the domain name and ensure you own it',
  },
  '2030166': {
    message: 'Domain is locked and cannot be modified',
    suggestion: 'Unlock the domain first with "namecheap domains unlock <domain>"',
  },
  '2030280': {
    message: 'Domain is not using Namecheap DNS',
    suggestion: 'Set nameservers to Namecheap defaults with "namecheap ns reset <domain>"',
  },
  '2030288': {
    message: 'DNS records cannot be modified',
    suggestion: 'Ensure the domain is using Namecheap DNS servers',
  },

  // Rate limiting (3031xxx)
  '3031510': {
    message: 'Rate limit exceeded',
    suggestion: 'Wait a few minutes before retrying',
  },

  // Account/Balance errors (2011xxx)
  '2011170': {
    message: 'Insufficient account balance',
    suggestion: 'Add funds to your Namecheap account',
  },
  '2011166': {
    message: 'The requested action requires additional account verification',
    suggestion: 'Contact Namecheap support or complete verification in your account',
  },

  // Transfer errors (3024xxx)
  '3024166': {
    message: 'Domain transfer is not allowed',
    suggestion: 'Ensure the domain is unlocked and has a valid auth code',
  },

  // General errors
  '1010104': {
    message: 'Invalid request parameters',
    suggestion: 'Check the command syntax with --help',
  },
  '2010324': {
    message: 'Invalid domain name format',
    suggestion: 'Use a valid domain format like example.com',
  },
  '5050900': {
    message: 'Server error occurred',
    suggestion: 'Try again later or contact Namecheap support',
  },
};

/**
 * Parse API error response and return friendly error info
 */
export function parseApiErrorCode(code: string): { message: string; suggestion: string } | null {
  return API_ERROR_MAP[code] || null;
}

/**
 * Format API errors with user-friendly messages
 */
export function formatApiErrors(errors: { code: string; message: string }[]): string {
  return errors
    .map((err) => {
      const friendlyError = parseApiErrorCode(err.code);
      if (friendlyError) {
        return `${friendlyError.message}\n  ${chalk.dim(`Suggestion: ${friendlyError.suggestion}`)}`;
      }
      return `[${err.code}] ${err.message}`;
    })
    .join('\n');
}

export class CliError extends Error {
  constructor(
    message: string,
    public readonly exitCode = 1,
    public readonly suggestion?: string,
  ) {
    super(message);
    this.name = 'CliError';
  }
}

export class AuthError extends CliError {
  constructor(message = 'Not authenticated. Run "namecheap auth login" first.') {
    super(message, 1, 'Run "namecheap auth login" to authenticate');
  }
}

export interface ApiErrorInfo {
  code: string;
  message: string;
}

export class ApiError extends CliError {
  public readonly errors: ApiErrorInfo[];

  constructor(message: string, errorsOrCode?: ApiErrorInfo[] | string, suggestion?: string) {
    super(message, 1, suggestion);
    this.name = 'ApiError';

    if (Array.isArray(errorsOrCode)) {
      this.errors = errorsOrCode;
    } else if (errorsOrCode) {
      this.errors = [{ code: errorsOrCode, message }];
    } else {
      this.errors = [];
    }
  }

  get code(): string | undefined {
    return this.errors[0]?.code;
  }
}

export class ValidationError extends CliError {
  constructor(message: string, suggestion?: string) {
    super(message, 1, suggestion);
    this.name = 'ValidationError';
  }
}

export function handleError(error: unknown): never {
  // Handle structured ApiError with error codes
  if (error instanceof ApiError && error.errors.length > 0) {
    console.error(chalk.red('API Error:'));

    for (const err of error.errors) {
      const friendlyError = parseApiErrorCode(err.code);
      if (friendlyError) {
        console.error(chalk.red('•'), friendlyError.message);
        console.error(chalk.dim(`  Suggestion: ${friendlyError.suggestion}`));
      } else {
        console.error(chalk.red('•'), `[${err.code}] ${err.message}`);
      }
    }

    process.exit(error.exitCode);
  }

  if (error instanceof CliError) {
    console.error(chalk.red('Error:'), error.message);
    if (error.suggestion) {
      console.error(chalk.dim(`Suggestion: ${error.suggestion}`));
    }
    process.exit(error.exitCode);
  }

  if (error instanceof Error) {
    // Check for common error patterns
    if (
      error.message.includes('No credentials found') ||
      error.message.includes('not authenticated')
    ) {
      console.error(chalk.red('Error:'), 'Not authenticated');
      console.error(chalk.dim('Run "namecheap auth login" to authenticate'));
      process.exit(1);
    }

    // Legacy: Parse API errors with error codes from string messages
    // TODO: Remove once all code uses structured ApiError
    if (error.message.includes('API Error')) {
      console.error(chalk.red('API Error:'));

      const codeMatches = error.message.matchAll(/\[(\d+)\]\s*([^\n]+)/g);
      let hasFormattedErrors = false;

      for (const match of codeMatches) {
        const code = match[1] ?? '';
        const originalMessage = match[2] ?? '';
        const friendlyError = parseApiErrorCode(code);

        if (friendlyError) {
          console.error(chalk.red('•'), friendlyError.message);
          console.error(chalk.dim(`  Suggestion: ${friendlyError.suggestion}`));
          hasFormattedErrors = true;
        } else {
          console.error(chalk.red('•'), `[${code}] ${originalMessage}`);
          hasFormattedErrors = true;
        }
      }

      if (!hasFormattedErrors) {
        console.error(error.message.replace('API Error:\n', ''));
      }

      process.exit(1);
    }

    // Network errors
    if (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('ENOTFOUND')
    ) {
      console.error(chalk.red('Error:'), 'Network error - unable to reach Namecheap API');
      console.error(chalk.dim('Check your internet connection and try again'));
      process.exit(1);
    }

    // HTTP errors
    const httpMatch = /HTTP error:\s*(\d+)/.exec(error.message);
    if (httpMatch?.[1]) {
      const statusCode = httpMatch[1];
      console.error(chalk.red('Error:'), `HTTP ${statusCode} error from Namecheap API`);
      if (statusCode === '401' || statusCode === '403') {
        console.error(chalk.dim('Check your API credentials with "namecheap auth status"'));
      } else if (statusCode === '429') {
        console.error(chalk.dim('Rate limited - wait a few minutes before retrying'));
      } else if (statusCode.startsWith('5')) {
        console.error(chalk.dim('Server error - try again later'));
      }
      process.exit(1);
    }

    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }

  console.error(chalk.red('An unexpected error occurred'));
  process.exit(1);
}

export function requireAuth(): void {
  // This is a placeholder - actual auth check happens in API client
  // But we can use this for early validation
}

export function validateDomain(domain: string): void {
  if (!domain) {
    throw new ValidationError('Domain name is required');
  }

  // Basic domain validation
  const domainRegex =
    /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  if (!domainRegex.test(domain)) {
    throw new ValidationError(
      `Invalid domain format: ${domain}`,
      'Domain should be in format: example.com or sub.example.com',
    );
  }
}

export function validateRecordType(type: string): void {
  const validTypes = [
    'A',
    'AAAA',
    'CNAME',
    'MX',
    'TXT',
    'NS',
    'SRV',
    'CAA',
    'ALIAS',
    'URL',
    'URL301',
    'FRAME',
  ];
  if (!validTypes.includes(type.toUpperCase())) {
    throw new ValidationError(
      `Invalid record type: ${type}`,
      `Valid types: ${validTypes.join(', ')}`,
    );
  }
}

export function validateIpAddress(ip: string): void {
  if (!ip) {
    throw new ValidationError(
      'IP address is required',
      'Provide a valid IPv4 (e.g., 1.2.3.4) or IPv6 address',
    );
  }

  const result = isIP(ip);

  if (result === 0) {
    throw new ValidationError(
      `Invalid IP address: ${ip}`,
      'Provide a valid IPv4 (e.g., 1.2.3.4) or IPv6 address (e.g., ::1)',
    );
  }
}
