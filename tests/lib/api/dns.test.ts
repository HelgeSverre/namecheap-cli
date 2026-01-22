import { describe, expect, test, mock, beforeEach, afterEach } from 'bun:test';
import { readFileSync } from 'fs';
import { join } from 'path';
import { NamecheapClient } from '../../../src/lib/api/client.js';
import {
  getDnsHosts,
  setDnsHosts,
  addDnsRecord,
  updateDnsRecord,
  deleteDnsRecord,
  getNameservers,
  setCustomNameservers,
  setDefaultNameservers,
  getEmailForwarding,
  setEmailForwarding,
  addEmailForward,
  removeEmailForward,
} from '../../../src/lib/api/dns.js';

const fixturesDir = join(import.meta.dir, '../../fixtures');

function loadFixture(name: string): string {
  return readFileSync(join(fixturesDir, name), 'utf-8');
}

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

describe('getDnsHosts', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('returns array of DNS records', async () => {
    const xml = loadFixture('dns-hosts.xml');
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const records = await getDnsHosts(client, 'example.com');

    expect(records).toBeArray();
    expect(records.length).toBe(4);
  });

  test('parses A records correctly', async () => {
    const xml = loadFixture('dns-hosts.xml');
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const records = await getDnsHosts(client, 'example.com');

    const aRecord = records.find((r) => r.type === 'A');
    expect(aRecord).toBeDefined();
    expect(aRecord?.name).toBe('@');
    expect(aRecord?.address).toBe('192.168.1.1');
    expect(aRecord?.ttl).toBe(1800);
    expect(aRecord?.isActive).toBe(true);
  });

  test('parses CNAME records correctly', async () => {
    const xml = loadFixture('dns-hosts.xml');
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const records = await getDnsHosts(client, 'example.com');

    const cnameRecord = records.find((r) => r.type === 'CNAME');
    expect(cnameRecord).toBeDefined();
    expect(cnameRecord?.name).toBe('www');
    expect(cnameRecord?.address).toBe('example.com.');
  });

  test('parses MX records with priority', async () => {
    const xml = loadFixture('dns-hosts.xml');
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const records = await getDnsHosts(client, 'example.com');

    const mxRecord = records.find((r) => r.type === 'MX');
    expect(mxRecord).toBeDefined();
    expect(mxRecord?.mxPref).toBe(10);
    expect(mxRecord?.address).toBe('mail.example.com.');
  });

  test('parses TXT records', async () => {
    const xml = loadFixture('dns-hosts.xml');
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const records = await getDnsHosts(client, 'example.com');

    const txtRecord = records.find((r) => r.type === 'TXT');
    expect(txtRecord).toBeDefined();
    expect(txtRecord?.address).toContain('spf1');
  });

  test('includes hostId for each record', async () => {
    const xml = loadFixture('dns-hosts.xml');
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const records = await getDnsHosts(client, 'example.com');

    records.forEach((record) => {
      expect(record.hostId).toBeDefined();
      expect(record.hostId).not.toBe('');
    });
  });

  test('parses domain into SLD and TLD', async () => {
    const xml = loadFixture('dns-hosts.xml');
    const fetchMock = mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    await getDnsHosts(client, 'example.com');

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('SLD=example');
    expect(callUrl).toContain('TLD=com');
  });

  test('strips subdomain and uses registrable domain', async () => {
    const xml = loadFixture('dns-hosts.xml');
    const fetchMock = mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    await getDnsHosts(client, 'sub.example.com');

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('SLD=example');
    expect(callUrl).toContain('TLD=com');
  });

  test('handles multi-part TLD', async () => {
    const xml = loadFixture('dns-hosts.xml');
    const fetchMock = mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    await getDnsHosts(client, 'example.co.uk');

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('SLD=example');
    expect(callUrl).toContain('TLD=co.uk');
  });
});

describe('getNameservers', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('returns nameserver info', async () => {
    const xml = loadFixture('nameservers.xml');
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const info = await getNameservers(client, 'example.com');

    expect(info).toBeDefined();
    expect(info.domain).toBe('example.com');
  });

  test('identifies Namecheap DNS usage', async () => {
    const xml = loadFixture('nameservers.xml');
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const info = await getNameservers(client, 'example.com');

    expect(info.isUsingOurDns).toBe(true);
  });

  test('returns nameserver list', async () => {
    const xml = loadFixture('nameservers.xml');
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const info = await getNameservers(client, 'example.com');

    expect(info.nameservers).toBeArray();
    expect(info.nameservers.length).toBe(2);
    expect(info.nameservers[0]).toContain('registrar-servers.com');
  });

  test('handles custom nameservers', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.domains.dns.getList">
    <DomainDNSGetListResult Domain="example.com" IsUsingOurDNS="false">
      <Nameserver>ns1.custom.com</Nameserver>
      <Nameserver>ns2.custom.com</Nameserver>
    </DomainDNSGetListResult>
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.2</ExecutionTime>
</ApiResponse>`;
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const info = await getNameservers(client, 'example.com');

    expect(info.isUsingOurDns).toBe(false);
    expect(info.nameservers).toContain('ns1.custom.com');
  });
});

describe('getEmailForwarding', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('returns array of email forwards', async () => {
    const xml = loadFixture('email-forwarding.xml');
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const forwards = await getEmailForwarding(client, 'example.com');

    expect(forwards).toBeArray();
    expect(forwards.length).toBe(2);
  });

  test('maps mailbox and forwardTo correctly', async () => {
    const xml = loadFixture('email-forwarding.xml');
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const forwards = await getEmailForwarding(client, 'example.com');

    const infoForward = forwards.find((f) => f.mailbox === 'info');
    expect(infoForward).toBeDefined();
    expect(infoForward?.forwardTo).toBe('admin@gmail.com');

    const supportForward = forwards.find((f) => f.mailbox === 'support');
    expect(supportForward).toBeDefined();
    expect(supportForward?.forwardTo).toBe('support@gmail.com');
  });

  test('returns empty array when no forwards exist', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.domains.dns.getEmailForwarding">
    <DomainDNSGetEmailForwardingResult Domain="example.com" />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const forwards = await getEmailForwarding(client, 'example.com');

    expect(forwards).toEqual([]);
  });

  test('handles single forward', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.domains.dns.getEmailForwarding">
    <DomainDNSGetEmailForwardingResult Domain="example.com">
      <Forward mailbox="hello" ForwardTo="me@example.com" />
    </DomainDNSGetEmailForwardingResult>
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const forwards = await getEmailForwarding(client, 'example.com');

    expect(forwards.length).toBe(1);
    expect(forwards[0]?.mailbox).toBe('hello');
  });
});

const successXml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse>
    <DomainDNSSetHostsResult Domain="example.com" IsSuccess="true" />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.5</ExecutionTime>
</ApiResponse>`;

describe('setDnsHosts', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('sets DNS hosts via POST', async () => {
    const fetchMock = mockFetch(successXml);
    const client = new NamecheapClient(mockCredentials, true);

    const result = await setDnsHosts(client, 'example.com', [
      { name: '@', type: 'A', address: '1.2.3.4', ttl: 1800 },
    ]);

    expect(result).toBe(true);
    const calls = fetchMock.mock.calls as unknown as [string, RequestInit][];
    expect(calls[0]?.[1]?.method).toBe('POST');
  });

  test('includes record parameters', async () => {
    const fetchMock = mockFetch(successXml);
    const client = new NamecheapClient(mockCredentials, true);

    await setDnsHosts(client, 'example.com', [
      { name: '@', type: 'A', address: '1.2.3.4', ttl: 1800 },
      { name: 'www', type: 'CNAME', address: 'example.com.', ttl: 3600 },
    ]);

    const calls = fetchMock.mock.calls as unknown as [string, RequestInit][];
    const body = calls[0]?.[1]?.body as string;
    expect(body).toContain('HostName1=%40');
    expect(body).toContain('RecordType1=A');
    expect(body).toContain('Address1=1.2.3.4');
    expect(body).toContain('HostName2=www');
    expect(body).toContain('RecordType2=CNAME');
  });

  test('includes MX priority for MX records', async () => {
    const fetchMock = mockFetch(successXml);
    const client = new NamecheapClient(mockCredentials, true);

    await setDnsHosts(client, 'example.com', [
      { name: '@', type: 'MX', address: 'mail.example.com.', mxPref: 10, ttl: 1800 },
    ]);

    const calls = fetchMock.mock.calls as unknown as [string, RequestInit][];
    const body = calls[0]?.[1]?.body as string;
    expect(body).toContain('MXPref1=10');
  });
});

describe('addDnsRecord', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('adds record to existing records', async () => {
    const dnsHostsXml = loadFixture('dns-hosts.xml');
    let callCount = 0;

    const mockFn = mock(() => {
      callCount++;
      // First call is GET to fetch existing, second is POST to set
      const xml = callCount === 1 ? dnsHostsXml : successXml;
      return Promise.resolve(new Response(xml, { status: 200 }));
    });
    global.fetch = mockFn as unknown as typeof fetch;

    const client = new NamecheapClient(mockCredentials, true);
    const result = await addDnsRecord(client, 'example.com', {
      name: 'new',
      type: 'A',
      address: '5.6.7.8',
      ttl: 1800,
    });

    expect(result).toBe(true);
    expect(callCount).toBe(2); // One GET, one POST
  });
});

describe('updateDnsRecord', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('updates existing record', async () => {
    const dnsHostsXml = loadFixture('dns-hosts.xml');
    let callCount = 0;

    const mockFn = mock(() => {
      callCount++;
      const xml = callCount === 1 ? dnsHostsXml : successXml;
      return Promise.resolve(new Response(xml, { status: 200 }));
    });
    global.fetch = mockFn as unknown as typeof fetch;

    const client = new NamecheapClient(mockCredentials, true);
    const result = await updateDnsRecord(client, 'example.com', '1', {
      address: '10.20.30.40',
    });

    expect(result).toBe(true);
    expect(callCount).toBe(2);
  });
});

describe('deleteDnsRecord', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('deletes record by hostId', async () => {
    const dnsHostsXml = loadFixture('dns-hosts.xml');
    let callCount = 0;

    const mockFn = mock(() => {
      callCount++;
      const xml = callCount === 1 ? dnsHostsXml : successXml;
      return Promise.resolve(new Response(xml, { status: 200 }));
    });
    global.fetch = mockFn as unknown as typeof fetch;

    const client = new NamecheapClient(mockCredentials, true);
    const result = await deleteDnsRecord(client, 'example.com', '1');

    expect(result).toBe(true);
    expect(callCount).toBe(2);
  });

  test('throws when record not found', async () => {
    const dnsHostsXml = loadFixture('dns-hosts.xml');
    mockFetch(dnsHostsXml);

    const client = new NamecheapClient(mockCredentials, true);

    await expect(deleteDnsRecord(client, 'example.com', 'nonexistent')).rejects.toThrow(
      'not found',
    );
  });
});

describe('setCustomNameservers', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('sets custom nameservers', async () => {
    const fetchMock = mockFetch(successXml);
    const client = new NamecheapClient(mockCredentials, true);

    const result = await setCustomNameservers(client, 'example.com', [
      'ns1.custom.com',
      'ns2.custom.com',
    ]);

    expect(result).toBe(true);
    const calls = fetchMock.mock.calls as unknown as [string][];
    expect(calls[0]?.[0]).toContain('Nameservers=ns1.custom.com%2Cns2.custom.com');
  });
});

describe('setDefaultNameservers', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('resets to default nameservers', async () => {
    const fetchMock = mockFetch(successXml);
    const client = new NamecheapClient(mockCredentials, true);

    const result = await setDefaultNameservers(client, 'example.com');

    expect(result).toBe(true);
    const calls = fetchMock.mock.calls as unknown as [string][];
    expect(calls[0]?.[0]).toContain('namecheap.domains.dns.setDefault');
  });
});

describe('setEmailForwarding', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('sets email forwards', async () => {
    const fetchMock = mockFetch(successXml);
    const client = new NamecheapClient(mockCredentials, true);

    const result = await setEmailForwarding(client, 'example.com', [
      { mailbox: 'info', forwardTo: 'admin@example.com' },
      { mailbox: 'support', forwardTo: 'help@example.com' },
    ]);

    expect(result).toBe(true);
    const calls = fetchMock.mock.calls as unknown as [string][];
    const url = calls[0]?.[0] ?? '';
    expect(url).toContain('MailBox1=info');
    expect(url).toContain('ForwardTo1=admin%40example.com');
    expect(url).toContain('MailBox2=support');
  });
});

describe('addEmailForward', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('adds new email forward', async () => {
    const emailXml = loadFixture('email-forwarding.xml');
    let callCount = 0;

    const mockFn = mock(() => {
      callCount++;
      const xml = callCount === 1 ? emailXml : successXml;
      return Promise.resolve(new Response(xml, { status: 200 }));
    });
    global.fetch = mockFn as unknown as typeof fetch;

    const client = new NamecheapClient(mockCredentials, true);
    const result = await addEmailForward(client, 'example.com', 'new', 'new@example.com');

    expect(result).toBe(true);
  });

  test('throws when forward already exists', async () => {
    const emailXml = loadFixture('email-forwarding.xml');
    mockFetch(emailXml);

    const client = new NamecheapClient(mockCredentials, true);

    await expect(
      addEmailForward(client, 'example.com', 'info', 'test@example.com'),
    ).rejects.toThrow('already exists');
  });
});

describe('removeEmailForward', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('removes email forward', async () => {
    const emailXml = loadFixture('email-forwarding.xml');
    let callCount = 0;

    const mockFn = mock(() => {
      callCount++;
      const xml = callCount === 1 ? emailXml : successXml;
      return Promise.resolve(new Response(xml, { status: 200 }));
    });
    global.fetch = mockFn as unknown as typeof fetch;

    const client = new NamecheapClient(mockCredentials, true);
    const result = await removeEmailForward(client, 'example.com', 'info');

    expect(result).toBe(true);
  });

  test('throws when forward not found', async () => {
    const emailXml = loadFixture('email-forwarding.xml');
    mockFetch(emailXml);

    const client = new NamecheapClient(mockCredentials, true);

    await expect(removeEmailForward(client, 'example.com', 'nonexistent')).rejects.toThrow(
      'not found',
    );
  });
});
