import { describe, expect, test, mock, beforeEach, afterEach } from 'bun:test';
import { NamecheapClient } from '../../../src/lib/api/client.js';
import {
  getWhoisGuardList,
  enableWhoisGuard,
  disableWhoisGuard,
  allotWhoisGuard,
  unallotWhoisGuard,
  renewWhoisGuard,
  findWhoisGuardByDomain,
} from '../../../src/lib/api/whoisguard.js';

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
  <CommandResponse Type="namecheap.whoisguard.enable">
    <WhoisguardEnableResult />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;

describe('getWhoisGuardList', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('returns empty result when no WhoisGuard items', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.whoisguard.getList">
    <WhoisguardGetListResult Type="whoisguard" />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await getWhoisGuardList(client);

    expect(result.items).toBeArray();
    expect(result.items.length).toBe(0);
    expect(result.totalItems).toBe(0);
    expect(result.currentPage).toBe(1);
    expect(result.pageSize).toBe(20);
  });

  test('returns single item correctly', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.whoisguard.getList">
    <WhoisguardGetListResult Type="whoisguard">
      <Whoisguard ID="12345" DomainName="example.com" Enabled="true" ExpDate="01/15/2025" Status="Active" EmailHash="abc123" />
      <Paging>
        <TotalItems>1</TotalItems>
        <CurrentPage>1</CurrentPage>
        <PageSize>20</PageSize>
      </Paging>
    </WhoisguardGetListResult>
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await getWhoisGuardList(client);

    expect(result.items.length).toBe(1);
    expect(result.items[0]?.id).toBe('12345');
    expect(result.items[0]?.domainName).toBe('example.com');
    expect(result.items[0]?.enabled).toBe(true);
    expect(result.items[0]?.expireDate).toBe('01/15/2025');
    expect(result.items[0]?.status).toBe('Active');
    expect(result.items[0]?.emailHash).toBe('abc123');
  });

  test('returns array of items correctly', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.whoisguard.getList">
    <WhoisguardGetListResult Type="whoisguard">
      <Whoisguard ID="12345" DomainName="example.com" Enabled="true" ExpDate="01/15/2025" Status="Active" EmailHash="abc123" />
      <Whoisguard ID="67890" DomainName="test.org" Enabled="false" ExpDate="06/20/2024" Status="Inactive" EmailHash="def456" />
      <Whoisguard ID="11111" DomainName="sample.net" Enabled="true" ExpDate="12/01/2026" Status="Active" />
      <Paging>
        <TotalItems>3</TotalItems>
        <CurrentPage>1</CurrentPage>
        <PageSize>20</PageSize>
      </Paging>
    </WhoisguardGetListResult>
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await getWhoisGuardList(client);

    expect(result.items.length).toBe(3);
    expect(result.items[0]?.id).toBe('12345');
    expect(result.items[1]?.id).toBe('67890');
    expect(result.items[2]?.id).toBe('11111');
    expect(result.items[2]?.emailHash).toBe('');
  });

  test('parses paging fields correctly', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.whoisguard.getList">
    <WhoisguardGetListResult Type="whoisguard">
      <Whoisguard ID="12345" DomainName="example.com" Enabled="true" ExpDate="01/15/2025" Status="Active" />
      <Paging>
        <TotalItems>150</TotalItems>
        <CurrentPage>3</CurrentPage>
        <PageSize>50</PageSize>
      </Paging>
    </WhoisguardGetListResult>
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await getWhoisGuardList(client, { page: 3, pageSize: 50 });

    expect(result.totalItems).toBe(150);
    expect(result.currentPage).toBe(3);
    expect(result.pageSize).toBe(50);
  });

  test('passes page and pageSize parameters', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.whoisguard.getList">
    <WhoisguardGetListResult Type="whoisguard" />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;
    const fetchMock = mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    await getWhoisGuardList(client, { page: 2, pageSize: 25 });

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('Page=2');
    expect(callUrl).toContain('PageSize=25');
  });
});

describe('enableWhoisGuard', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('calls API with WhoisguardID parameter', async () => {
    const fetchMock = mockFetch(successXml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await enableWhoisGuard(client, '12345', 'admin@example.com');

    expect(result).toBe(true);
    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('WhoisguardID=12345');
    expect(callUrl).toContain('ForwardedToEmail=admin%40example.com');
  });

  test('returns true on success', async () => {
    mockFetch(successXml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await enableWhoisGuard(client, '12345', 'test@example.com');

    expect(result).toBe(true);
  });
});

describe('disableWhoisGuard', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('calls API with WhoisguardID parameter', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.whoisguard.disable">
    <WhoisguardDisableResult />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;
    const fetchMock = mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await disableWhoisGuard(client, '67890');

    expect(result).toBe(true);
    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('WhoisguardID=67890');
  });

  test('returns true on success', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.whoisguard.disable">
    <WhoisguardDisableResult />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await disableWhoisGuard(client, '12345');

    expect(result).toBe(true);
  });
});

describe('allotWhoisGuard', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('calls API with WhoisguardID parameter', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.whoisguard.allot">
    <WhoisguardAllotResult />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;
    const fetchMock = mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await allotWhoisGuard(client, '12345', 'example.com');

    expect(result).toBe(true);
    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('WhoisguardID=12345');
    expect(callUrl).toContain('DomainName=example.com');
  });

  test('returns true on success', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.whoisguard.allot">
    <WhoisguardAllotResult />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await allotWhoisGuard(client, '12345', 'example.com');

    expect(result).toBe(true);
  });
});

describe('unallotWhoisGuard', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('calls API with WhoisguardID parameter', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.whoisguard.unallot">
    <WhoisguardUnallotResult />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;
    const fetchMock = mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await unallotWhoisGuard(client, '99999');

    expect(result).toBe(true);
    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('WhoisguardID=99999');
  });

  test('returns true on success', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.whoisguard.unallot">
    <WhoisguardUnallotResult />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await unallotWhoisGuard(client, '12345');

    expect(result).toBe(true);
  });
});

describe('renewWhoisGuard', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('renews without promo code', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.whoisguard.renew">
    <WhoisguardRenewResult WhoisguardId="12345" Years="1" Renew="true" OrderId="123456" TransactionId="789012" ChargedAmount="5.88" />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.2</ExecutionTime>
</ApiResponse>`;
    const fetchMock = mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await renewWhoisGuard(client, '12345');

    expect(String(result.whoisguardId)).toBe('12345');
    expect(result.years).toBe(1);
    expect(result.renewed).toBe(true);
    expect(result.chargedAmount).toBe(5.88);
    expect(result.orderId).toBe(123456);
    expect(result.transactionId).toBe(789012);

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('WhoisguardID=12345');
    expect(callUrl).toContain('Years=1');
    expect(callUrl).not.toContain('PromotionCode');
  });

  test('renews with promo code', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.whoisguard.renew">
    <WhoisguardRenewResult WhoisguardId="12345" Years="2" Renew="true" OrderId="123456" TransactionId="789012" ChargedAmount="9.99" />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.2</ExecutionTime>
</ApiResponse>`;
    const fetchMock = mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await renewWhoisGuard(client, '12345', 2, 'PROMO50');

    expect(result.years).toBe(2);
    expect(result.chargedAmount).toBe(9.99);

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('Years=2');
    expect(callUrl).toContain('PromotionCode=PROMO50');
  });

  test('throws error when no renewal result returned', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.whoisguard.renew">
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.2</ExecutionTime>
</ApiResponse>`;
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);

    await expect(renewWhoisGuard(client, '12345')).rejects.toThrow('No renewal result returned');
  });

  test('handles zero charged amount', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.whoisguard.renew">
    <WhoisguardRenewResult WhoisguardId="12345" Years="1" Renew="true" OrderId="123456" TransactionId="789012" ChargedAmount="0" />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.2</ExecutionTime>
</ApiResponse>`;
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await renewWhoisGuard(client, '12345');

    expect(result.chargedAmount).toBe(0);
  });
});

describe('findWhoisGuardByDomain', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('finds WhoisGuard by domain (case-insensitive)', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.whoisguard.getList">
    <WhoisguardGetListResult Type="whoisguard">
      <Whoisguard ID="12345" DomainName="example.com" Enabled="true" ExpDate="01/15/2025" Status="Active" />
      <Whoisguard ID="67890" DomainName="TEST.ORG" Enabled="false" ExpDate="06/20/2024" Status="Inactive" />
      <Paging>
        <TotalItems>2</TotalItems>
        <CurrentPage>1</CurrentPage>
        <PageSize>100</PageSize>
      </Paging>
    </WhoisguardGetListResult>
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await findWhoisGuardByDomain(client, 'test.org');

    expect(result).not.toBeNull();
    expect(result?.id).toBe('67890');
    expect(result?.domainName).toBe('TEST.ORG');
  });

  test('finds WhoisGuard with uppercase search', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.whoisguard.getList">
    <WhoisguardGetListResult Type="whoisguard">
      <Whoisguard ID="12345" DomainName="example.com" Enabled="true" ExpDate="01/15/2025" Status="Active" />
      <Paging>
        <TotalItems>1</TotalItems>
        <CurrentPage>1</CurrentPage>
        <PageSize>100</PageSize>
      </Paging>
    </WhoisguardGetListResult>
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await findWhoisGuardByDomain(client, 'EXAMPLE.COM');

    expect(result).not.toBeNull();
    expect(result?.id).toBe('12345');
  });

  test('returns null when domain not found', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.whoisguard.getList">
    <WhoisguardGetListResult Type="whoisguard">
      <Whoisguard ID="12345" DomainName="example.com" Enabled="true" ExpDate="01/15/2025" Status="Active" />
      <Paging>
        <TotalItems>1</TotalItems>
        <CurrentPage>1</CurrentPage>
        <PageSize>100</PageSize>
      </Paging>
    </WhoisguardGetListResult>
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await findWhoisGuardByDomain(client, 'notfound.com');

    expect(result).toBeNull();
  });

  test('returns null when list is empty', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.whoisguard.getList">
    <WhoisguardGetListResult Type="whoisguard" />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await findWhoisGuardByDomain(client, 'example.com');

    expect(result).toBeNull();
  });

  test('uses pageSize of 100', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.whoisguard.getList">
    <WhoisguardGetListResult Type="whoisguard" />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;
    const fetchMock = mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    await findWhoisGuardByDomain(client, 'example.com');

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('PageSize=100');
  });
});
