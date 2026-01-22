import { describe, expect, test, mock, beforeEach, afterEach } from 'bun:test';
import { NamecheapClient } from '../../../src/lib/api/client.js';
import {
  createChildNameserver,
  deleteChildNameserver,
  getChildNameserverInfo,
  updateChildNameserver,
} from '../../../src/lib/api/ns.js';

const mockCredentials = {
  apiUser: 'testuser',
  apiKey: 'testkey',
  userName: 'testuser',
  clientIp: '127.0.0.1',
};

function mockFetch(xml: string) {
  const mockFn = mock(() =>
    Promise.resolve(
      new Response(xml, {
        status: 200,
        headers: { 'Content-Type': 'application/xml' },
      }),
    ),
  );
  global.fetch = mockFn as unknown as typeof fetch;
  return mockFn;
}

const successXml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.domains.ns.create">
    <DomainNSCreateResult Domain="example.com" Nameserver="ns1.example.com" IP="192.168.1.1" IsSuccess="true" />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;

const nsInfoXml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.domains.ns.getInfo">
    <DomainNSInfoResult Nameserver="ns1.example.com" IP="192.168.1.1">
      <NameserverStatuses>
        <Status>OK</Status>
        <Status>Linked</Status>
      </NameserverStatuses>
    </DomainNSInfoResult>
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;

const nsInfoSingleStatusXml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.domains.ns.getInfo">
    <DomainNSInfoResult Nameserver="ns1.example.com" IP="192.168.1.1">
      <NameserverStatuses>
        <Status>OK</Status>
      </NameserverStatuses>
    </DomainNSInfoResult>
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;

const nsInfoNoStatusXml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.domains.ns.getInfo">
    <DomainNSInfoResult Nameserver="ns1.example.com" IP="192.168.1.1">
    </DomainNSInfoResult>
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;

const nsInfoMissingResultXml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.domains.ns.getInfo">
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;

const nsInfoAttributeFormatXml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.domains.ns.getInfo">
    <DomainNSInfoResult Nameserver="ns1.example.com" IP="10.0.0.1">
      <NameserverStatuses>
        <Status>Active</Status>
      </NameserverStatuses>
    </DomainNSInfoResult>
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;

describe('createChildNameserver', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('creates child nameserver successfully', async () => {
    mockFetch(successXml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await createChildNameserver(
      client,
      'example.com',
      'ns1.example.com',
      '192.168.1.1',
    );

    expect(result).toBe(true);
  });

  test('passes correct parameters to API', async () => {
    const fetchMock = mockFetch(successXml);

    const client = new NamecheapClient(mockCredentials, true);
    await createChildNameserver(client, 'example.com', 'ns1.example.com', '192.168.1.1');

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('SLD=example');
    expect(callUrl).toContain('TLD=com');
    expect(callUrl).toContain('Nameserver=ns1.example.com');
    expect(callUrl).toContain('IP=192.168.1.1');
  });

  test('parses domain into SLD and TLD', async () => {
    const fetchMock = mockFetch(successXml);

    const client = new NamecheapClient(mockCredentials, true);
    await createChildNameserver(client, 'example.com', 'ns1', '192.168.1.1');

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('SLD=example');
    expect(callUrl).toContain('TLD=com');
  });

  test('strips subdomain and uses registrable domain', async () => {
    const fetchMock = mockFetch(successXml);

    const client = new NamecheapClient(mockCredentials, true);
    await createChildNameserver(client, 'sub.example.com', 'ns1', '192.168.1.1');

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('SLD=example');
    expect(callUrl).toContain('TLD=com');
  });

  test('handles multi-part TLD', async () => {
    const fetchMock = mockFetch(successXml);

    const client = new NamecheapClient(mockCredentials, true);
    await createChildNameserver(client, 'example.co.uk', 'ns1', '192.168.1.1');

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('SLD=example');
    expect(callUrl).toContain('TLD=co.uk');
  });

  test('calls correct API command', async () => {
    const fetchMock = mockFetch(successXml);

    const client = new NamecheapClient(mockCredentials, true);
    await createChildNameserver(client, 'example.com', 'ns1', '192.168.1.1');

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('Command=namecheap.domains.ns.create');
  });
});

describe('deleteChildNameserver', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('deletes child nameserver successfully', async () => {
    mockFetch(successXml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await deleteChildNameserver(client, 'example.com', 'ns1.example.com');

    expect(result).toBe(true);
  });

  test('passes correct parameters to API', async () => {
    const fetchMock = mockFetch(successXml);

    const client = new NamecheapClient(mockCredentials, true);
    await deleteChildNameserver(client, 'example.com', 'ns1.example.com');

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('SLD=example');
    expect(callUrl).toContain('TLD=com');
    expect(callUrl).toContain('Nameserver=ns1.example.com');
  });

  test('calls correct API command', async () => {
    const fetchMock = mockFetch(successXml);

    const client = new NamecheapClient(mockCredentials, true);
    await deleteChildNameserver(client, 'example.com', 'ns1.example.com');

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('Command=namecheap.domains.ns.delete');
  });

  test('strips subdomain and uses registrable domain', async () => {
    const fetchMock = mockFetch(successXml);

    const client = new NamecheapClient(mockCredentials, true);
    await deleteChildNameserver(client, 'sub.example.com', 'ns1');

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('SLD=example');
    expect(callUrl).toContain('TLD=com');
  });
});

describe('getChildNameserverInfo', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('returns nameserver info', async () => {
    mockFetch(nsInfoXml);

    const client = new NamecheapClient(mockCredentials, true);
    const info = await getChildNameserverInfo(client, 'example.com', 'ns1.example.com');

    expect(info).toBeDefined();
    expect(info.nameserver).toBe('ns1.example.com');
    expect(info.ip).toBe('192.168.1.1');
  });

  test('parses multiple statuses as array', async () => {
    mockFetch(nsInfoXml);

    const client = new NamecheapClient(mockCredentials, true);
    const info = await getChildNameserverInfo(client, 'example.com', 'ns1.example.com');

    expect(info.statuses).toBeArray();
    expect(info.statuses.length).toBe(2);
    expect(info.statuses).toContain('OK');
    expect(info.statuses).toContain('Linked');
  });

  test('parses single status as array', async () => {
    mockFetch(nsInfoSingleStatusXml);

    const client = new NamecheapClient(mockCredentials, true);
    const info = await getChildNameserverInfo(client, 'example.com', 'ns1.example.com');

    expect(info.statuses).toBeArray();
    expect(info.statuses.length).toBe(1);
    expect(info.statuses[0]).toBe('OK');
  });

  test('handles missing statuses', async () => {
    mockFetch(nsInfoNoStatusXml);

    const client = new NamecheapClient(mockCredentials, true);
    const info = await getChildNameserverInfo(client, 'example.com', 'ns1.example.com');

    expect(info.statuses).toBeArray();
    expect(info.statuses.length).toBe(0);
  });

  test('throws when result is missing', async () => {
    mockFetch(nsInfoMissingResultXml);

    const client = new NamecheapClient(mockCredentials, true);

    await expect(getChildNameserverInfo(client, 'example.com', 'ns1.example.com')).rejects.toThrow(
      'No nameserver info returned from API',
    );
  });

  test('passes correct parameters to API', async () => {
    const fetchMock = mockFetch(nsInfoXml);

    const client = new NamecheapClient(mockCredentials, true);
    await getChildNameserverInfo(client, 'example.com', 'ns1.example.com');

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('SLD=example');
    expect(callUrl).toContain('TLD=com');
    expect(callUrl).toContain('Nameserver=ns1.example.com');
  });

  test('calls correct API command', async () => {
    const fetchMock = mockFetch(nsInfoXml);

    const client = new NamecheapClient(mockCredentials, true);
    await getChildNameserverInfo(client, 'example.com', 'ns1.example.com');

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('Command=namecheap.domains.ns.getInfo');
  });

  test('strips subdomain and uses registrable domain', async () => {
    const fetchMock = mockFetch(nsInfoXml);

    const client = new NamecheapClient(mockCredentials, true);
    await getChildNameserverInfo(client, 'sub.example.com', 'ns1');

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('SLD=example');
    expect(callUrl).toContain('TLD=com');
  });

  test('uses attribute format for nameserver and IP', async () => {
    mockFetch(nsInfoAttributeFormatXml);

    const client = new NamecheapClient(mockCredentials, true);
    const info = await getChildNameserverInfo(client, 'example.com', 'ns1.example.com');

    expect(info.nameserver).toBe('ns1.example.com');
    expect(info.ip).toBe('10.0.0.1');
  });
});

describe('updateChildNameserver', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('updates child nameserver successfully', async () => {
    mockFetch(successXml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await updateChildNameserver(
      client,
      'example.com',
      'ns1.example.com',
      '192.168.1.1',
      '10.0.0.1',
    );

    expect(result).toBe(true);
  });

  test('passes correct parameters to API', async () => {
    const fetchMock = mockFetch(successXml);

    const client = new NamecheapClient(mockCredentials, true);
    await updateChildNameserver(
      client,
      'example.com',
      'ns1.example.com',
      '192.168.1.1',
      '10.0.0.1',
    );

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('SLD=example');
    expect(callUrl).toContain('TLD=com');
    expect(callUrl).toContain('Nameserver=ns1.example.com');
    expect(callUrl).toContain('OldIP=192.168.1.1');
    expect(callUrl).toContain('IP=10.0.0.1');
  });

  test('calls correct API command', async () => {
    const fetchMock = mockFetch(successXml);

    const client = new NamecheapClient(mockCredentials, true);
    await updateChildNameserver(
      client,
      'example.com',
      'ns1.example.com',
      '192.168.1.1',
      '10.0.0.1',
    );

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('Command=namecheap.domains.ns.update');
  });

  test('strips subdomain and uses registrable domain', async () => {
    const fetchMock = mockFetch(successXml);

    const client = new NamecheapClient(mockCredentials, true);
    await updateChildNameserver(client, 'sub.example.com', 'ns1', '192.168.1.1', '10.0.0.1');

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('SLD=example');
    expect(callUrl).toContain('TLD=com');
  });
});
