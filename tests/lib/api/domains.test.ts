import { describe, expect, test, mock, beforeEach, afterEach } from 'bun:test';
import { readFileSync } from 'fs';
import { join } from 'path';
import { NamecheapClient } from '../../../src/lib/api/client.js';
import {
  listDomains,
  getDomainInfo,
  checkDomainAvailability,
  setRegistrarLock,
  getRegistrarLock,
  getContacts,
  setContacts,
  registerDomain,
  renewDomain,
  reactivateDomain,
} from '../../../src/lib/api/domains.js';
import { ApiError } from '../../../src/utils/errors.js';

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

function mockFetchError(status: number, statusText: string) {
  const mockFn = mock(() =>
    Promise.resolve(
      new Response('', {
        status,
        statusText,
      }),
    ),
  );
  global.fetch = mockFn as unknown as typeof fetch;
  return mockFn;
}

describe('listDomains', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('returns array of domains', async () => {
    const xml = loadFixture('domain-list.xml');
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await listDomains(client);

    expect(result.domains).toBeArray();
    expect(result.domains.length).toBe(2);
  });

  test('maps domain fields correctly', async () => {
    const xml = loadFixture('domain-list.xml');
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await listDomains(client);

    const domain = result.domains[0]!;
    expect(domain.name).toBe('example.com');
    expect(domain.id).toBe(12345);
    expect(domain.isLocked).toBe(true);
    expect(domain.autoRenew).toBe(true);
    expect(domain.whoisGuard).toBe('ENABLED');
    expect(domain.isOurDns).toBe(true);
  });

  test('handles pagination parameters', async () => {
    const xml = loadFixture('domain-list.xml');
    const fetchMock = mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    await listDomains(client, { page: 2, pageSize: 50 });

    expect(fetchMock).toHaveBeenCalled();
    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('Page=2');
    expect(callUrl).toContain('PageSize=50');
  });

  test('throws ApiError on API error', async () => {
    const xml = loadFixture('error-response.xml');
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);

    await expect(listDomains(client)).rejects.toThrow(ApiError);
  });

  test('throws on HTTP error', async () => {
    mockFetchError(500, 'Internal Server Error');

    const client = new NamecheapClient(mockCredentials, true);

    await expect(listDomains(client)).rejects.toThrow('HTTP error: 500');
  });
});

describe('getDomainInfo', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('returns domain info object', async () => {
    const xml = loadFixture('domain-info.xml');
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const info = await getDomainInfo(client, 'example.com');

    expect(info).toBeDefined();
    expect(info.domainName).toBe('example.com');
  });

  test('includes WhoisGuard info', async () => {
    const xml = loadFixture('domain-info.xml');
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const info = await getDomainInfo(client, 'example.com');

    expect(info.whoisGuard).toBeDefined();
    expect(info.whoisGuard.enabled).toBe(true);
    expect(String(info.whoisGuard.id)).toBe('123456');
  });

  test('includes DNS provider type', async () => {
    const xml = loadFixture('domain-info.xml');
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const info = await getDomainInfo(client, 'example.com');

    expect(info.dnsProviderType).toBe('CUSTOM');
  });

  test('includes owner and status', async () => {
    const xml = loadFixture('domain-info.xml');
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const info = await getDomainInfo(client, 'example.com');

    expect(info.ownerName).toBe('testuser');
    expect(info.status).toBe('Ok');
    expect(info.isOwner).toBe(true);
  });

  test('passes domain name to API', async () => {
    const xml = loadFixture('domain-info.xml');
    const fetchMock = mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    await getDomainInfo(client, 'example.com');

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('DomainName=example.com');
  });
});

describe('checkDomainAvailability', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('returns availability results', async () => {
    const xml = loadFixture('domain-check.xml');
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const results = await checkDomainAvailability(client, [
      'available-domain.com',
      'example.com',
      'premium-domain.io',
    ]);

    expect(results).toBeArray();
    expect(results.length).toBe(3);
  });

  test('identifies available domains', async () => {
    const xml = loadFixture('domain-check.xml');
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const results = await checkDomainAvailability(client, ['available-domain.com']);

    const available = results.find((r) => r.domain === 'available-domain.com');
    expect(available?.available).toBe(true);
    expect(available?.premium).toBe(false);
  });

  test('identifies unavailable domains', async () => {
    const xml = loadFixture('domain-check.xml');
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const results = await checkDomainAvailability(client, ['example.com']);

    const unavailable = results.find((r) => r.domain === 'example.com');
    expect(unavailable?.available).toBe(false);
  });

  test('identifies premium domains with pricing', async () => {
    const xml = loadFixture('domain-check.xml');
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const results = await checkDomainAvailability(client, ['premium-domain.io']);

    const premium = results.find((r) => r.domain === 'premium-domain.io');
    expect(premium?.premium).toBe(true);
    expect(premium?.premiumPrice).toBe(1500);
  });

  test('joins multiple domains with comma', async () => {
    const xml = loadFixture('domain-check.xml');
    const fetchMock = mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    await checkDomainAvailability(client, ['domain1.com', 'domain2.com']);

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('DomainList=domain1.com%2Cdomain2.com');
  });
});

describe('NamecheapClient.handleResponse', () => {
  test('returns data for successful response', () => {
    const response = {
      success: true,
      errors: [],
      warnings: [],
      data: { test: 'value' },
    };

    const result = NamecheapClient.handleResponse(response);
    expect(result).toEqual({ test: 'value' });
  });

  test('throws ApiError for error response', () => {
    const response = {
      success: false,
      errors: [{ code: '1234', message: 'Test error' }],
      warnings: [],
      data: undefined,
    };

    expect(() => {
      NamecheapClient.handleResponse(response);
    }).toThrow(ApiError);

    try {
      NamecheapClient.handleResponse(response);
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      const apiError = error as ApiError;
      expect(apiError.errors[0]?.code).toBe('1234');
      expect(apiError.errors[0]?.message).toBe('Test error');
      expect(apiError.message).toContain('Test error');
    }
  });

  test('throws for response with no data', () => {
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
});

const successXml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse>
    <DomainSetRegistrarLockResult Domain="example.com" IsSuccess="true" />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.5</ExecutionTime>
</ApiResponse>`;

describe('setRegistrarLock', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('locks domain', async () => {
    const fetchMock = mockFetch(successXml);
    const client = new NamecheapClient(mockCredentials, true);

    const result = await setRegistrarLock(client, 'example.com', true);

    expect(result).toBe(true);
    const calls = fetchMock.mock.calls as unknown as [string][];
    expect(calls[0]?.[0]).toContain('LockAction=LOCK');
  });

  test('unlocks domain', async () => {
    const fetchMock = mockFetch(successXml);
    const client = new NamecheapClient(mockCredentials, true);

    const result = await setRegistrarLock(client, 'example.com', false);

    expect(result).toBe(true);
    const calls = fetchMock.mock.calls as unknown as [string][];
    expect(calls[0]?.[0]).toContain('LockAction=UNLOCK');
  });
});

describe('getRegistrarLock', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('returns lock status true', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse>
    <DomainGetRegistrarLockResult RegistrarLockStatus="true" />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.2</ExecutionTime>
</ApiResponse>`;
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await getRegistrarLock(client, 'example.com');

    expect(result).toBe(true);
  });

  test('returns lock status false', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse>
    <DomainGetRegistrarLockResult RegistrarLockStatus="false" />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.2</ExecutionTime>
</ApiResponse>`;
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await getRegistrarLock(client, 'example.com');

    expect(result).toBe(false);
  });
});

describe('getContacts', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('returns contact information', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse>
    <DomainContactsResult>
      <Registrant>
        <FirstName>John</FirstName>
        <LastName>Doe</LastName>
        <Address1>123 Main St</Address1>
        <City>New York</City>
        <StateProvince>NY</StateProvince>
        <PostalCode>10001</PostalCode>
        <Country>US</Country>
        <Phone>+1.2125551234</Phone>
        <EmailAddress>john@example.com</EmailAddress>
      </Registrant>
      <Tech>
        <FirstName>Jane</FirstName>
        <LastName>Smith</LastName>
        <Address1>456 Tech Ave</Address1>
        <City>San Francisco</City>
        <StateProvince>CA</StateProvince>
        <PostalCode>94102</PostalCode>
        <Country>US</Country>
        <Phone>+1.4155559876</Phone>
        <EmailAddress>jane@example.com</EmailAddress>
      </Tech>
      <Admin>
        <FirstName>Admin</FirstName>
        <LastName>User</LastName>
        <Address1>789 Admin Blvd</Address1>
        <City>Chicago</City>
        <StateProvince>IL</StateProvince>
        <PostalCode>60601</PostalCode>
        <Country>US</Country>
        <Phone>+1.3125554321</Phone>
        <EmailAddress>admin@example.com</EmailAddress>
      </Admin>
      <AuxBilling>
        <FirstName>Billing</FirstName>
        <LastName>Contact</LastName>
        <Address1>101 Billing Lane</Address1>
        <City>Austin</City>
        <StateProvince>TX</StateProvince>
        <PostalCode>78701</PostalCode>
        <Country>US</Country>
        <Phone>+1.5125556789</Phone>
        <EmailAddress>billing@example.com</EmailAddress>
      </AuxBilling>
    </DomainContactsResult>
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.3</ExecutionTime>
</ApiResponse>`;
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const contacts = await getContacts(client, 'example.com');

    expect(contacts.registrant.firstName).toBe('John');
    expect(contacts.registrant.lastName).toBe('Doe');
    expect(contacts.registrant.email).toBe('john@example.com');

    expect(contacts.tech.firstName).toBe('Jane');
    expect(contacts.admin.firstName).toBe('Admin');
    expect(contacts.auxBilling.firstName).toBe('Billing');
  });

  test('handles missing optional fields', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse>
    <DomainContactsResult>
      <Registrant>
        <FirstName>John</FirstName>
        <LastName>Doe</LastName>
        <Address1>123 Main St</Address1>
        <City>New York</City>
        <StateProvince>NY</StateProvince>
        <PostalCode>10001</PostalCode>
        <Country>US</Country>
        <Phone>+1.2125551234</Phone>
        <EmailAddress>john@example.com</EmailAddress>
      </Registrant>
    </DomainContactsResult>
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.3</ExecutionTime>
</ApiResponse>`;
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const contacts = await getContacts(client, 'example.com');

    // Tech/Admin/AuxBilling should be empty but not throw
    expect(contacts.tech.firstName).toBe('');
    expect(contacts.admin.firstName).toBe('');
    expect(contacts.auxBilling.firstName).toBe('');
  });
});

describe('registerDomain', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const registrationXml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse>
    <DomainCreateResult Domain="newdomain.com" Registered="true" ChargedAmount="10.98" DomainID="12345" OrderID="67890" TransactionID="11111" WhoisguardEnable="true" NonRealTimeDomain="false" />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>1.5</ExecutionTime>
</ApiResponse>`;

  test('registers domain with default options', async () => {
    mockFetch(registrationXml);
    const client = new NamecheapClient(mockCredentials, true);

    const result = await registerDomain(client, 'newdomain.com');

    expect(result.domain).toBe('newdomain.com');
    expect(result.registered).toBe(true);
    expect(result.chargedAmount).toBe(10.98);
    expect(result.domainId).toBe(12345);
    expect(result.whoisguardEnabled).toBe(true);
  });

  test('includes years parameter', async () => {
    const fetchMock = mockFetch(registrationXml);
    const client = new NamecheapClient(mockCredentials, true);

    await registerDomain(client, 'newdomain.com', { years: 2 });

    const calls = fetchMock.mock.calls as unknown as [string][];
    expect(calls[0]?.[0]).toContain('Years=2');
  });

  test('includes nameservers when provided', async () => {
    const fetchMock = mockFetch(registrationXml);
    const client = new NamecheapClient(mockCredentials, true);

    await registerDomain(client, 'newdomain.com', {
      nameservers: ['ns1.example.com', 'ns2.example.com'],
    });

    const calls = fetchMock.mock.calls as unknown as [string][];
    expect(calls[0]?.[0]).toContain('Nameservers=ns1.example.com%2Cns2.example.com');
  });

  test('includes promo code when provided', async () => {
    const fetchMock = mockFetch(registrationXml);
    const client = new NamecheapClient(mockCredentials, true);

    await registerDomain(client, 'newdomain.com', { promoCode: 'SAVE10' });

    const calls = fetchMock.mock.calls as unknown as [string][];
    expect(calls[0]?.[0]).toContain('PromotionCode=SAVE10');
  });

  test('includes contact information when provided', async () => {
    const fetchMock = mockFetch(registrationXml);
    const client = new NamecheapClient(mockCredentials, true);

    await registerDomain(client, 'newdomain.com', {
      contacts: {
        registrant: {
          firstName: 'John',
          lastName: 'Doe',
          address1: '123 Main St',
          city: 'New York',
          stateProvince: 'NY',
          postalCode: '10001',
          country: 'US',
          phone: '+1.2125551234',
          email: 'john@example.com',
        },
      },
    });

    const calls = fetchMock.mock.calls as unknown as [string][];
    const url = calls[0]?.[0] ?? '';
    expect(url).toContain('RegistrantFirstName=John');
    expect(url).toContain('RegistrantLastName=Doe');
    expect(url).toContain('TechFirstName=John'); // Falls back to registrant
    expect(url).toContain('AdminFirstName=John'); // Falls back to registrant
  });

  test('includes optional contact fields', async () => {
    const fetchMock = mockFetch(registrationXml);
    const client = new NamecheapClient(mockCredentials, true);

    await registerDomain(client, 'newdomain.com', {
      contacts: {
        registrant: {
          firstName: 'John',
          lastName: 'Doe',
          address1: '123 Main St',
          address2: 'Suite 100',
          city: 'New York',
          stateProvince: 'NY',
          postalCode: '10001',
          country: 'US',
          phone: '+1.2125551234',
          phoneExt: '123',
          fax: '+1.2125551235',
          email: 'john@example.com',
          organizationName: 'Acme Inc',
          jobTitle: 'CEO',
        },
      },
    });

    const calls = fetchMock.mock.calls as unknown as [string][];
    const url = calls[0]?.[0] ?? '';
    expect(url).toContain('RegistrantAddress2=Suite');
    expect(url).toContain('RegistrantPhoneExt=123');
    expect(url).toContain('RegistrantOrganizationName=Acme');
  });

  test('disables WhoisGuard when specified', async () => {
    const fetchMock = mockFetch(registrationXml);
    const client = new NamecheapClient(mockCredentials, true);

    await registerDomain(client, 'newdomain.com', {
      addFreeWhoisguard: false,
      enableWhoisguard: false,
    });

    const calls = fetchMock.mock.calls as unknown as [string][];
    const url = calls[0]?.[0] ?? '';
    expect(url).toContain('AddFreeWhoisguard=no');
    expect(url).toContain('WGEnabled=no');
  });

  test('throws when no result returned', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse />
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.5</ExecutionTime>
</ApiResponse>`;
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);

    await expect(registerDomain(client, 'newdomain.com')).rejects.toThrow('No registration result');
  });
});

describe('renewDomain', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const renewalXml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse>
    <DomainRenewResult DomainName="example.com" DomainID="12345" Renew="true" OrderID="67890" TransactionID="11111" ChargedAmount="12.98">
      <DomainDetails>
        <ExpiredDate>01/01/2026</ExpiredDate>
      </DomainDetails>
    </DomainRenewResult>
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>1.2</ExecutionTime>
</ApiResponse>`;

  test('renews domain with default 1 year', async () => {
    mockFetch(renewalXml);
    const client = new NamecheapClient(mockCredentials, true);

    const result = await renewDomain(client, 'example.com');

    expect(result.domainName).toBe('example.com');
    expect(result.charged).toBe(true);
    expect(result.chargedAmount).toBe(12.98);
    expect(result.expireDate).toBe('01/01/2026');
  });

  test('includes years parameter', async () => {
    const fetchMock = mockFetch(renewalXml);
    const client = new NamecheapClient(mockCredentials, true);

    await renewDomain(client, 'example.com', 3);

    const calls = fetchMock.mock.calls as unknown as [string][];
    expect(calls[0]?.[0]).toContain('Years=3');
  });

  test('includes promo code when provided', async () => {
    const fetchMock = mockFetch(renewalXml);
    const client = new NamecheapClient(mockCredentials, true);

    await renewDomain(client, 'example.com', 1, 'RENEW20');

    const calls = fetchMock.mock.calls as unknown as [string][];
    expect(calls[0]?.[0]).toContain('PromotionCode=RENEW20');
  });

  test('throws when no result returned', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse />
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.5</ExecutionTime>
</ApiResponse>`;
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);

    await expect(renewDomain(client, 'example.com')).rejects.toThrow('No renewal result');
  });
});

describe('reactivateDomain', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const reactivateXml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse>
    <DomainReactivateResult Domain="expired.com" IsSuccess="true" OrderID="67890" TransactionID="11111" ChargedAmount="50.00" />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>2.0</ExecutionTime>
</ApiResponse>`;

  test('reactivates expired domain', async () => {
    mockFetch(reactivateXml);
    const client = new NamecheapClient(mockCredentials, true);

    const result = await reactivateDomain(client, 'expired.com');

    expect(result.domainName).toBe('expired.com');
    expect(result.charged).toBe(true);
    expect(result.chargedAmount).toBe(50);
    expect(result.domainId).toBe(0); // Reactivate doesn't return domain ID
  });

  test('includes years parameter', async () => {
    const fetchMock = mockFetch(reactivateXml);
    const client = new NamecheapClient(mockCredentials, true);

    await reactivateDomain(client, 'expired.com', 2);

    const calls = fetchMock.mock.calls as unknown as [string][];
    expect(calls[0]?.[0]).toContain('Years=2');
  });

  test('includes promo code when provided', async () => {
    const fetchMock = mockFetch(reactivateXml);
    const client = new NamecheapClient(mockCredentials, true);

    await reactivateDomain(client, 'expired.com', 1, 'REACTIVATE10');

    const calls = fetchMock.mock.calls as unknown as [string][];
    expect(calls[0]?.[0]).toContain('PromotionCode=REACTIVATE10');
  });

  test('throws when no result returned', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse />
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.5</ExecutionTime>
</ApiResponse>`;
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);

    await expect(reactivateDomain(client, 'expired.com')).rejects.toThrow('No reactivation result');
  });
});

describe('setContacts', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const getContactsXml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse>
    <DomainContactsResult>
      <Registrant>
        <FirstName>Old</FirstName>
        <LastName>Name</LastName>
        <Address1>Old Address</Address1>
        <City>Old City</City>
        <StateProvince>OC</StateProvince>
        <PostalCode>00000</PostalCode>
        <Country>US</Country>
        <Phone>+1.0000000000</Phone>
        <EmailAddress>old@example.com</EmailAddress>
      </Registrant>
      <Tech>
        <FirstName>Tech</FirstName>
        <LastName>Person</LastName>
        <Address1>Tech Address</Address1>
        <City>Tech City</City>
        <StateProvince>TC</StateProvince>
        <PostalCode>11111</PostalCode>
        <Country>US</Country>
        <Phone>+1.1111111111</Phone>
        <EmailAddress>tech@example.com</EmailAddress>
      </Tech>
      <Admin>
        <FirstName>Admin</FirstName>
        <LastName>Person</LastName>
        <Address1>Admin Address</Address1>
        <City>Admin City</City>
        <StateProvince>AC</StateProvince>
        <PostalCode>22222</PostalCode>
        <Country>US</Country>
        <Phone>+1.2222222222</Phone>
        <EmailAddress>admin@example.com</EmailAddress>
      </Admin>
      <AuxBilling>
        <FirstName>Billing</FirstName>
        <LastName>Person</LastName>
        <Address1>Billing Address</Address1>
        <City>Billing City</City>
        <StateProvince>BC</StateProvince>
        <PostalCode>33333</PostalCode>
        <Country>US</Country>
        <Phone>+1.3333333333</Phone>
        <EmailAddress>billing@example.com</EmailAddress>
      </AuxBilling>
    </DomainContactsResult>
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.3</ExecutionTime>
</ApiResponse>`;

  test('updates registrant contact', async () => {
    let callCount = 0;
    const mockFn = mock(() => {
      callCount++;
      const xml = callCount === 1 ? getContactsXml : successXml;
      return Promise.resolve(new Response(xml, { status: 200 }));
    });
    global.fetch = mockFn as unknown as typeof fetch;

    const client = new NamecheapClient(mockCredentials, true);
    const result = await setContacts(client, 'example.com', {
      registrant: {
        firstName: 'New',
        lastName: 'Name',
        address1: 'New Address',
        city: 'New City',
        stateProvince: 'NC',
        postalCode: '99999',
        country: 'US',
        phone: '+1.9999999999',
        email: 'new@example.com',
      },
    });

    expect(result).toBe(true);
    expect(callCount).toBe(2); // First GET existing, then POST update

    // Verify the second call contains new registrant info
    const calls = mockFn.mock.calls as unknown as [string][];
    const url = calls[1]?.[0] ?? '';
    expect(url).toContain('RegistrantFirstName=New');
    expect(url).toContain('TechFirstName=Tech'); // Existing tech preserved
  });

  test('preserves existing contacts when not provided', async () => {
    let callCount = 0;
    const mockFn = mock(() => {
      callCount++;
      const xml = callCount === 1 ? getContactsXml : successXml;
      return Promise.resolve(new Response(xml, { status: 200 }));
    });
    global.fetch = mockFn as unknown as typeof fetch;

    const client = new NamecheapClient(mockCredentials, true);
    await setContacts(client, 'example.com', {});

    const calls = mockFn.mock.calls as unknown as [string][];
    const url = calls[1]?.[0] ?? '';
    // All existing contacts should be preserved
    expect(url).toContain('RegistrantFirstName=Old');
    expect(url).toContain('TechFirstName=Tech');
    expect(url).toContain('AdminFirstName=Admin');
    expect(url).toContain('AuxBillingFirstName=Billing');
  });
});
