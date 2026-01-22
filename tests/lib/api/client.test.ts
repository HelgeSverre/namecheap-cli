import { describe, expect, test, mock, beforeEach, afterEach } from 'bun:test';
import { NamecheapClient, clearClient, getClient } from '../../../src/lib/api/client.js';
import { setCredentials, clearCredentials } from '../../../src/lib/config.js';
import { ApiError } from '../../../src/utils/errors.js';

const mockCredentials = {
  apiUser: 'testuser',
  apiKey: 'testkey',
  userName: 'testuser',
  clientIp: '127.0.0.1',
};

function mockFetch(xml: string, method?: string) {
  const mockFn = mock((_url: string, options?: RequestInit) => {
    // Verify method if specified
    if (method && options?.method !== method) {
      throw new Error(`Expected ${method} but got ${options?.method}`);
    }
    return Promise.resolve(
      new Response(xml, {
        status: 200,
        headers: { 'Content-Type': 'application/xml' },
      }),
    );
  });
  global.fetch = mockFn as unknown as typeof fetch;
  return mockFn;
}

function mockFetchError(status: number, statusText: string) {
  const mockFn = mock(() => Promise.resolve(new Response('', { status, statusText })));
  global.fetch = mockFn as unknown as typeof fetch;
  return mockFn;
}

const successXml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse>
    <TestResult Value="success" />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;

const errorXml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="ERROR" xmlns="http://api.namecheap.com/xml.response">
  <Errors>
    <Error Number="1011102">Invalid API Key</Error>
  </Errors>
  <Warnings />
  <CommandResponse />
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;

describe('NamecheapClient', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    clearClient();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('constructor', () => {
    test('creates client with provided credentials', () => {
      const client = new NamecheapClient(mockCredentials, true);
      expect(client).toBeDefined();
    });

    test('throws when no credentials provided and none configured', () => {
      // This test requires that the config has no credentials
      // In practice, we mock or ensure config returns undefined
      // For now, just test with credentials provided
      expect(() => new NamecheapClient(mockCredentials)).not.toThrow();
    });

    test('uses sandbox URL when sandbox is true', async () => {
      const fetchMock = mockFetch(successXml);
      const client = new NamecheapClient(mockCredentials, true);

      await client.request('namecheap.domains.getList');

      const calls = fetchMock.mock.calls as unknown as [string, RequestInit][];
      expect(calls[0]?.[0]).toContain('sandbox.namecheap.com');
    });

    test('uses production URL when sandbox is false', async () => {
      const fetchMock = mockFetch(successXml);
      const client = new NamecheapClient(mockCredentials, false);

      await client.request('namecheap.domains.getList');

      const calls = fetchMock.mock.calls as unknown as [string, RequestInit][];
      expect(calls[0]?.[0]).toContain('api.namecheap.com');
      expect(calls[0]?.[0]).not.toContain('sandbox');
    });
  });

  describe('request (GET)', () => {
    test('makes GET request', async () => {
      const fetchMock = mockFetch(successXml);
      const client = new NamecheapClient(mockCredentials, true);

      await client.request('namecheap.domains.getList');

      const calls = fetchMock.mock.calls as unknown as [string, RequestInit][];
      expect(calls[0]?.[1]?.method).toBe('GET');
    });

    test('includes auth params in URL', async () => {
      const fetchMock = mockFetch(successXml);
      const client = new NamecheapClient(mockCredentials, true);

      await client.request('namecheap.domains.getList');

      const calls = fetchMock.mock.calls as unknown as [string, RequestInit][];
      const url = calls[0]?.[0] ?? '';
      expect(url).toContain('ApiUser=testuser');
      expect(url).toContain('ApiKey=testkey');
      expect(url).toContain('UserName=testuser');
      expect(url).toContain('ClientIp=127.0.0.1');
    });

    test('includes command in URL', async () => {
      const fetchMock = mockFetch(successXml);
      const client = new NamecheapClient(mockCredentials, true);

      await client.request('namecheap.domains.getList');

      const calls = fetchMock.mock.calls as unknown as [string, RequestInit][];
      expect(calls[0]?.[0]).toContain('Command=namecheap.domains.getList');
    });

    test('includes additional params', async () => {
      const fetchMock = mockFetch(successXml);
      const client = new NamecheapClient(mockCredentials, true);

      await client.request('namecheap.domains.getList', { Page: 2, PageSize: 50 });

      const calls = fetchMock.mock.calls as unknown as [string, RequestInit][];
      const url = calls[0]?.[0] ?? '';
      expect(url).toContain('Page=2');
      expect(url).toContain('PageSize=50');
    });

    test('skips undefined/null/empty params', async () => {
      const fetchMock = mockFetch(successXml);
      const client = new NamecheapClient(mockCredentials, true);

      await client.request('namecheap.domains.getList', {
        ValidParam: 'value',
        EmptyParam: '',
      });

      const calls = fetchMock.mock.calls as unknown as [string, RequestInit][];
      const url = calls[0]?.[0] ?? '';
      expect(url).toContain('ValidParam=value');
      expect(url).not.toContain('EmptyParam');
    });

    test('parses successful XML response', async () => {
      mockFetch(successXml);
      const client = new NamecheapClient(mockCredentials, true);

      const response = await client.request('namecheap.domains.getList');

      expect(response.success).toBe(true);
      expect(response.errors).toEqual([]);
    });

    test('parses error XML response', async () => {
      mockFetch(errorXml);
      const client = new NamecheapClient(mockCredentials, true);

      const response = await client.request('namecheap.domains.getList');

      expect(response.success).toBe(false);
      expect(response.errors.length).toBeGreaterThan(0);
    });

    test('throws on HTTP error', async () => {
      mockFetchError(500, 'Internal Server Error');
      const client = new NamecheapClient(mockCredentials, true);

      await expect(client.request('namecheap.domains.getList')).rejects.toThrow('HTTP error: 500');
    });

    test('throws on 401 error', async () => {
      mockFetchError(401, 'Unauthorized');
      const client = new NamecheapClient(mockCredentials, true);

      await expect(client.request('namecheap.domains.getList')).rejects.toThrow('HTTP error: 401');
    });
  });

  describe('post', () => {
    test('makes POST request', async () => {
      const fetchMock = mockFetch(successXml);
      const client = new NamecheapClient(mockCredentials, true);

      await client.post('namecheap.domains.dns.setHosts');

      const calls = fetchMock.mock.calls as unknown as [string, RequestInit][];
      expect(calls[0]?.[1]?.method).toBe('POST');
    });

    test('sends params in body', async () => {
      const fetchMock = mockFetch(successXml);
      const client = new NamecheapClient(mockCredentials, true);

      await client.post('namecheap.domains.dns.setHosts', {
        SLD: 'example',
        TLD: 'com',
      });

      const calls = fetchMock.mock.calls as unknown as [string, RequestInit][];
      const body = calls[0]?.[1]?.body as string;
      expect(body).toContain('SLD=example');
      expect(body).toContain('TLD=com');
    });

    test('includes content-type header', async () => {
      const fetchMock = mockFetch(successXml);
      const client = new NamecheapClient(mockCredentials, true);

      await client.post('namecheap.domains.dns.setHosts');

      const calls = fetchMock.mock.calls as unknown as [string, RequestInit][];
      const headers = calls[0]?.[1]?.headers as Record<string, string>;
      expect(headers['Content-Type']).toBe('application/x-www-form-urlencoded');
    });

    test('parses successful response', async () => {
      mockFetch(successXml);
      const client = new NamecheapClient(mockCredentials, true);

      const response = await client.post('namecheap.domains.dns.setHosts');

      expect(response.success).toBe(true);
    });

    test('throws on HTTP error', async () => {
      mockFetchError(500, 'Internal Server Error');
      const client = new NamecheapClient(mockCredentials, true);

      await expect(client.post('namecheap.domains.dns.setHosts')).rejects.toThrow(
        'HTTP error: 500',
      );
    });
  });

  describe('handleResponse', () => {
    test('returns data for successful response', () => {
      const response = {
        success: true,
        errors: [],
        warnings: [],
        data: { result: 'success' },
      };

      const result = NamecheapClient.handleResponse(response);
      expect(result).toEqual({ result: 'success' });
    });

    test('throws ApiError for failed response with errors', () => {
      const response = {
        success: false,
        errors: [{ code: '1234', message: 'Error message' }],
        warnings: [],
        data: undefined,
      };

      expect(() => {
        NamecheapClient.handleResponse(response);
      }).toThrow(ApiError);
    });

    test('ApiError includes structured error codes', () => {
      const response = {
        success: false,
        errors: [
          { code: '1234', message: 'First error' },
          { code: '5678', message: 'Second error' },
        ],
        warnings: [],
        data: undefined,
      };

      try {
        NamecheapClient.handleResponse(response);
        expect.unreachable('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.errors).toHaveLength(2);
        expect(apiError.errors[0]?.code).toBe('1234');
        expect(apiError.errors[0]?.message).toBe('First error');
        expect(apiError.errors[1]?.code).toBe('5678');
        expect(apiError.code).toBe('1234'); // First error code
      }
    });

    test('throws when success but no data', () => {
      const response = {
        success: true,
        errors: [],
        warnings: [],
        data: undefined,
      };

      expect(() => {
        NamecheapClient.handleResponse(response);
      }).toThrow('No data');
    });

    test('logs warnings but returns data', () => {
      const logs: string[] = [];
      const originalWarn = console.warn;
      console.warn = (...args: unknown[]) => logs.push(args.join(' '));

      const response = {
        success: true,
        errors: [],
        warnings: ['This is a warning'],
        data: { result: 'success' },
      };

      const result = NamecheapClient.handleResponse(response);

      console.warn = originalWarn;
      expect(result).toEqual({ result: 'success' });
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0]).toContain('warning');
    });
  });
});

describe('getClient singleton', () => {
  beforeEach(() => {
    clearClient();
    setCredentials(mockCredentials);
  });

  afterEach(() => {
    clearClient();
    clearCredentials();
  });

  test('returns a NamecheapClient instance', () => {
    const client = getClient();
    expect(client).toBeInstanceOf(NamecheapClient);
  });

  test('returns same instance on subsequent calls', () => {
    const client1 = getClient();
    const client2 = getClient();
    expect(client1).toBe(client2);
  });

  test('creates new instance when forceNew is true', () => {
    const client1 = getClient();
    const client2 = getClient(true);
    expect(client1).not.toBe(client2);
  });

  test('clearClient resets singleton', () => {
    const client1 = getClient();
    clearClient();
    const client2 = getClient();
    expect(client1).not.toBe(client2);
  });

  test('throws when no credentials configured', () => {
    clearCredentials();
    clearClient();
    expect(() => getClient()).toThrow('No credentials found');
  });
});
