import { getCredentials, isSandboxMode } from '../config.js';
import { parseApiResponse } from './parser.js';
import type { ApiCommand, ApiCredentials, ApiResponse } from './types.js';

const PRODUCTION_URL = 'https://api.namecheap.com/xml.response';
const SANDBOX_URL = 'https://api.sandbox.namecheap.com/xml.response';

export class NamecheapClient {
  private credentials: ApiCredentials;
  private baseUrl: string;

  constructor(credentials?: ApiCredentials, sandbox?: boolean) {
    const creds = credentials || getCredentials();
    if (!creds) {
      throw new Error('No credentials found. Run "namecheap auth login" first.');
    }
    this.credentials = creds;
    this.baseUrl = (sandbox ?? isSandboxMode()) ? SANDBOX_URL : PRODUCTION_URL;
  }

  private buildParams(
    command: ApiCommand,
    params: Record<string, string | number | boolean> = {},
  ): URLSearchParams {
    const searchParams = new URLSearchParams();

    // Global parameters
    searchParams.set('ApiUser', this.credentials.apiUser);
    searchParams.set('ApiKey', this.credentials.apiKey);
    searchParams.set('UserName', this.credentials.userName);
    searchParams.set('ClientIp', this.credentials.clientIp);
    searchParams.set('Command', command);

    // Additional parameters
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, String(value));
      }
    }

    return searchParams;
  }

  async request<T>(
    command: ApiCommand,
    params: Record<string, string | number | boolean> = {},
  ): Promise<ApiResponse<T>> {
    const searchParams = this.buildParams(command, params);
    const url = `${this.baseUrl}?${searchParams.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/xml',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }

    const xml = await response.text();
    return parseApiResponse<T>(xml);
  }

  async post<T>(
    command: ApiCommand,
    params: Record<string, string | number | boolean> = {},
  ): Promise<ApiResponse<T>> {
    const searchParams = this.buildParams(command, params);

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/xml',
      },
      body: searchParams.toString(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }

    const xml = await response.text();
    return parseApiResponse<T>(xml);
  }

  // Convenience method for handling API errors
  static handleResponse<T>(response: ApiResponse<T>): T {
    if (!response.success) {
      const errorMessages = response.errors.map((e) => `[${e.code}] ${e.message}`).join('\n');
      throw new Error(`API Error:\n${errorMessages}`);
    }

    if (response.warnings.length > 0) {
      console.warn('API Warnings:', response.warnings.join(', '));
    }

    if (response.data === undefined) {
      throw new Error('No data in API response');
    }

    return response.data;
  }
}

// Singleton instance for convenience
let clientInstance: NamecheapClient | null = null;

export function getClient(forceNew = false): NamecheapClient {
  if (forceNew || !clientInstance) {
    clientInstance = new NamecheapClient();
  }
  return clientInstance;
}

export function clearClient(): void {
  clientInstance = null;
}
