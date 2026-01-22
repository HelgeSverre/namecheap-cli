import { describe, expect, test, mock, beforeEach, afterEach } from 'bun:test';
import { NamecheapClient } from '../../../src/lib/api/client.js';
import {
  getAddressList,
  getAddressInfo,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../../../src/lib/api/address.js';
import type { AddressInput } from '../../../src/lib/api/address.js';

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

const mockAddressInput: AddressInput = {
  name: 'Home Address',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  address1: '123 Main St',
  city: 'New York',
  stateProvince: 'NY',
  stateProvinceChoice: 'S',
  zip: '10001',
  country: 'US',
  phone: '+1.2125551234',
};

describe('getAddressList', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('returns empty array when no addresses', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.users.address.getList">
    <AddressGetListResult />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await getAddressList(client);

    expect(result.items).toBeArray();
    expect(result.items.length).toBe(0);
  });

  test('returns single address correctly', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.users.address.getList">
    <AddressGetListResult>
      <List AddressId="12345" AddressName="Home Address" />
    </AddressGetListResult>
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await getAddressList(client);

    expect(result.items.length).toBe(1);
    expect(result.items[0]?.id).toBe('12345');
    expect(result.items[0]?.name).toBe('Home Address');
  });

  test('returns array of addresses correctly', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.users.address.getList">
    <AddressGetListResult>
      <List AddressId="12345" AddressName="Home Address" />
      <List AddressId="67890" AddressName="Work Address" />
      <List AddressId="11111" AddressName="Billing Address" />
    </AddressGetListResult>
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await getAddressList(client);

    expect(result.items.length).toBe(3);
    expect(result.items[0]?.id).toBe('12345');
    expect(result.items[0]?.name).toBe('Home Address');
    expect(result.items[1]?.id).toBe('67890');
    expect(result.items[1]?.name).toBe('Work Address');
    expect(result.items[2]?.id).toBe('11111');
    expect(result.items[2]?.name).toBe('Billing Address');
  });

  test('handles missing AddressName attribute', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.users.address.getList">
    <AddressGetListResult>
      <List AddressId="12345" />
    </AddressGetListResult>
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await getAddressList(client);

    expect(result.items.length).toBe(1);
    expect(result.items[0]?.id).toBe('12345');
    expect(result.items[0]?.name).toBe('');
  });
});

describe('getAddressInfo', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('returns full address details', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.users.address.getInfo">
    <GetAddressInfoResult AddressId="12345" AddressName="Home Address" Default_YN="true">
      <FirstName>John</FirstName>
      <LastName>Doe</LastName>
      <EmailAddress>john@example.com</EmailAddress>
      <JobTitle>Developer</JobTitle>
      <Organization>ACME Corp</Organization>
      <Address1>123 Main St</Address1>
      <Address2>Suite 100</Address2>
      <City>New York</City>
      <StateProvince>NY</StateProvince>
      <StateProvinceChoice>S</StateProvinceChoice>
      <Zip>10001</Zip>
      <Country>US</Country>
      <Phone>+1.2125551234x</Phone>
      <PhoneExt>ext123</PhoneExt>
      <Fax>+1.2125555678x</Fax>
    </GetAddressInfoResult>
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await getAddressInfo(client, '12345');

    expect(result.id).toBe('12345');
    expect(result.name).toBe('Home Address');
    expect(result.firstName).toBe('John');
    expect(result.lastName).toBe('Doe');
    expect(result.email).toBe('john@example.com');
    expect(result.jobTitle).toBe('Developer');
    expect(result.organization).toBe('ACME Corp');
    expect(result.address1).toBe('123 Main St');
    expect(result.address2).toBe('Suite 100');
    expect(result.city).toBe('New York');
    expect(result.stateProvince).toBe('NY');
    expect(result.stateProvinceChoice).toBe('S');
    expect(String(result.zip)).toBe('10001');
    expect(result.country).toBe('US');
    expect(result.phone).toBe('+1.2125551234x');
    expect(result.phoneExt).toBe('ext123');
    expect(result.fax).toBe('+1.2125555678x');
    expect(result.default).toBe(true);
  });

  test('parses default values for missing optional fields', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.users.address.getInfo">
    <GetAddressInfoResult AddressId="12345" AddressName="Home Address" Default_YN="false">
      <FirstName>John</FirstName>
      <LastName>Doe</LastName>
      <EmailAddress>john@example.com</EmailAddress>
      <Address1>123 Main St</Address1>
      <City>New York</City>
      <StateProvince>NY</StateProvince>
      <StateProvinceChoice>S</StateProvinceChoice>
      <Zip>10001</Zip>
      <Country>US</Country>
      <Phone>+1.2125551234</Phone>
    </GetAddressInfoResult>
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await getAddressInfo(client, '12345');

    expect(result.jobTitle).toBeUndefined();
    expect(result.organization).toBeUndefined();
    expect(result.address2).toBeUndefined();
    expect(result.phoneExt).toBeUndefined();
    expect(result.fax).toBeUndefined();
    expect(result.default).toBe(false);
  });

  test('sends AddressId parameter', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.users.address.getInfo">
    <GetAddressInfoResult AddressId="99999" AddressName="Test" Default_YN="false">
      <FirstName>Test</FirstName>
      <LastName>User</LastName>
      <EmailAddress>test@example.com</EmailAddress>
      <Address1>456 Test Ave</Address1>
      <City>Boston</City>
      <StateProvince>MA</StateProvince>
      <StateProvinceChoice>S</StateProvinceChoice>
      <Zip>02101</Zip>
      <Country>US</Country>
      <Phone>+1.6175551234</Phone>
    </GetAddressInfoResult>
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;
    const fetchMock = mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    await getAddressInfo(client, '99999');

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('AddressId=99999');
  });

  test('throws error when no address info returned', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.users.address.getInfo">
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);

    await expect(getAddressInfo(client, '12345')).rejects.toThrow(
      'No address info returned from API',
    );
  });
});

describe('createAddress', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('returns success result with addressId', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.users.address.create">
    <AddressCreateResult AddressId="12345" AddressName="Home Address" Success="true" />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await createAddress(client, mockAddressInput);

    expect(result.success).toBe(true);
    expect(result.addressId).toBe('12345');
    expect(result.addressName).toBe('Home Address');
  });

  test('sends correct required parameters', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.users.address.create">
    <AddressCreateResult AddressId="12345" AddressName="Home Address" Success="true" />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;
    const fetchMock = mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    await createAddress(client, mockAddressInput);

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('AddressName=Home+Address');
    expect(callUrl).toContain('FirstName=John');
    expect(callUrl).toContain('LastName=Doe');
    expect(callUrl).toContain('EmailAddress=john%40example.com');
    expect(callUrl).toContain('Address1=123+Main+St');
    expect(callUrl).toContain('City=New+York');
    expect(callUrl).toContain('StateProvince=NY');
    expect(callUrl).toContain('StateProvinceChoice=S');
    expect(callUrl).toContain('Zip=10001');
    expect(callUrl).toContain('Country=US');
    expect(callUrl).toContain('Phone=%2B1.2125551234');
  });

  test('sends optional parameters when provided', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.users.address.create">
    <AddressCreateResult AddressId="12345" AddressName="Work Address" Success="true" />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;
    const fetchMock = mockFetch(xml);

    const input: AddressInput = {
      ...mockAddressInput,
      name: 'Work Address',
      jobTitle: 'Developer',
      organization: 'ACME Corp',
      address2: 'Suite 100',
      phoneExt: '123',
      fax: '+1.2125555678',
      default: true,
    };

    const client = new NamecheapClient(mockCredentials, true);
    await createAddress(client, input);

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('JobTitle=Developer');
    expect(callUrl).toContain('Organization=ACME+Corp');
    expect(callUrl).toContain('Address2=Suite+100');
    expect(callUrl).toContain('PhoneExt=123');
    expect(callUrl).toContain('Fax=%2B1.2125555678');
    expect(callUrl).toContain('DefaultYN=1');
  });

  test('sends DefaultYN=0 when default is false', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.users.address.create">
    <AddressCreateResult AddressId="12345" AddressName="Home Address" Success="true" />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;
    const fetchMock = mockFetch(xml);

    const input: AddressInput = {
      ...mockAddressInput,
      default: false,
    };

    const client = new NamecheapClient(mockCredentials, true);
    await createAddress(client, input);

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('DefaultYN=0');
  });

  test('throws error when no result returned', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.users.address.create">
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);

    await expect(createAddress(client, mockAddressInput)).rejects.toThrow(
      'No result returned from API',
    );
  });
});

describe('updateAddress', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('returns success result', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.users.address.update">
    <AddressUpdateResult AddressId="12345" AddressName="Updated Address" Success="true" />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await updateAddress(client, '12345', mockAddressInput);

    expect(result.success).toBe(true);
    expect(result.addressId).toBe('12345');
    expect(result.addressName).toBe('Updated Address');
  });

  test('sends addressId and input params correctly', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.users.address.update">
    <AddressUpdateResult AddressId="99999" AddressName="Home Address" Success="true" />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;
    const fetchMock = mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    await updateAddress(client, '99999', mockAddressInput);

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('AddressId=99999');
    expect(callUrl).toContain('AddressName=Home+Address');
    expect(callUrl).toContain('FirstName=John');
    expect(callUrl).toContain('LastName=Doe');
  });

  test('throws error when no result returned', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.users.address.update">
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);

    await expect(updateAddress(client, '12345', mockAddressInput)).rejects.toThrow(
      'No result returned from API',
    );
  });
});

describe('deleteAddress', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('returns success result', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.users.address.delete">
    <AddressDeleteResult ProfileId="54321" UserName="testuser" Success="true" />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await deleteAddress(client, '12345');

    expect(result.success).toBe(true);
    expect(result.profileId).toBe('54321');
    expect(result.username).toBe('testuser');
  });

  test('sends addressId parameter', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.users.address.delete">
    <AddressDeleteResult ProfileId="54321" UserName="testuser" Success="true" />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;
    const fetchMock = mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    await deleteAddress(client, '12345');

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('AddressId=12345');
  });

  test('throws error when no result returned', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.users.address.delete">
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);

    await expect(deleteAddress(client, '12345')).rejects.toThrow('No result returned from API');
  });
});

describe('setDefaultAddress', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('returns success result', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.users.address.setDefault">
    <AddressSetDefaultResult AddressId="12345" Success="true" />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await setDefaultAddress(client, '12345');

    expect(result.success).toBe(true);
    expect(result.addressId).toBe('12345');
  });

  test('sends addressId parameter', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.users.address.setDefault">
    <AddressSetDefaultResult AddressId="99999" Success="true" />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;
    const fetchMock = mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);
    await setDefaultAddress(client, '99999');

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('AddressId=99999');
  });

  test('throws error when no result returned', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.users.address.setDefault">
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;
    mockFetch(xml);

    const client = new NamecheapClient(mockCredentials, true);

    await expect(setDefaultAddress(client, '12345')).rejects.toThrow('No result returned from API');
  });
});
