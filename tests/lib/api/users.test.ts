import { describe, expect, test, mock, beforeEach, afterEach } from 'bun:test';
import { NamecheapClient } from '../../../src/lib/api/client.js';
import { getBalances, getPricing } from '../../../src/lib/api/users.js';
import { ApiError } from '../../../src/utils/errors.js';

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

const balancesSuccessXml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.users.getBalances">
    <UserGetBalancesResult Currency="USD" AvailableBalance="125.50" AccountBalance="150.00" EarnedAmount="25.00" WithdrawableAmount="100.00" PendingAmount="10.00" />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;

const balancesMinimalXml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.users.getBalances">
    <UserGetBalancesResult />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;

const balancesErrorXml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="ERROR" xmlns="http://api.namecheap.com/xml.response">
  <Errors>
    <Error Number="1010101">Authentication failed</Error>
    <Error Number="2020202">Invalid API key</Error>
  </Errors>
  <Warnings />
  <CommandResponse />
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;

const pricingSuccessXml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.users.getPricing">
    <UserGetPricingResult>
      <ProductType Name="DOMAIN">
        <ProductCategory Name="register">
          <Product Name="com">
            <Price Duration="1" Price="8.88" AdditionalCost="0.18" RegularPrice="10.98" YourPrice="9.06" YourPriceType="COUPON" Currency="USD" />
            <Price Duration="2" Price="17.76" AdditionalCost="0.36" RegularPrice="21.96" YourPrice="18.12" YourPriceType="COUPON" Currency="USD" />
          </Product>
          <Product Name="net">
            <Price Duration="1" Price="11.98" AdditionalCost="0.18" RegularPrice="12.98" YourPrice="12.16" YourPriceType="REGULAR" Currency="USD" />
          </Product>
        </ProductCategory>
      </ProductType>
    </UserGetPricingResult>
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.2</ExecutionTime>
</ApiResponse>`;

const pricingMultipleCategoriesXml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.users.getPricing">
    <UserGetPricingResult>
      <ProductType Name="DOMAIN">
        <ProductCategory Name="register">
          <Product Name="com">
            <Price Duration="1" Price="8.88" AdditionalCost="0.18" RegularPrice="10.98" YourPrice="9.06" YourPriceType="COUPON" Currency="USD" />
          </Product>
        </ProductCategory>
        <ProductCategory Name="renew">
          <Product Name="com">
            <Price Duration="1" Price="12.98" AdditionalCost="0.18" RegularPrice="14.98" YourPrice="13.16" YourPriceType="REGULAR" Currency="USD" />
          </Product>
        </ProductCategory>
      </ProductType>
    </UserGetPricingResult>
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.2</ExecutionTime>
</ApiResponse>`;

const pricingEmptyXml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.users.getPricing">
    <UserGetPricingResult />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;

const pricingErrorXml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="ERROR" xmlns="http://api.namecheap.com/xml.response">
  <Errors>
    <Error Number="3030303">Invalid ProductType</Error>
  </Errors>
  <Warnings />
  <CommandResponse />
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;

describe('getBalances', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('returns user balance information', async () => {
    mockFetch(balancesSuccessXml);

    const client = new NamecheapClient(mockCredentials, true);
    const balances = await getBalances(client);

    expect(balances).toBeDefined();
    expect(balances.currency).toBe('USD');
  });

  test('parses numeric balance values correctly', async () => {
    mockFetch(balancesSuccessXml);

    const client = new NamecheapClient(mockCredentials, true);
    const balances = await getBalances(client);

    expect(balances.availableBalance).toBe(125.5);
    expect(balances.accountBalance).toBe(150);
    expect(balances.earnedAmount).toBe(25);
    expect(balances.withdrawableAmount).toBe(100);
    expect(balances.pendingAmount).toBe(10);
  });

  test('uses default values for missing attributes', async () => {
    mockFetch(balancesMinimalXml);

    const client = new NamecheapClient(mockCredentials, true);
    const balances = await getBalances(client);

    expect(balances.currency).toBe('USD');
    expect(balances.availableBalance).toBe(0);
    expect(balances.accountBalance).toBe(0);
    expect(balances.earnedAmount).toBe(0);
    expect(balances.withdrawableAmount).toBe(0);
    expect(balances.pendingAmount).toBe(0);
  });

  test('throws ApiError on API failure', async () => {
    mockFetch(balancesErrorXml);

    const client = new NamecheapClient(mockCredentials, true);

    await expect(getBalances(client)).rejects.toThrow(ApiError);
  });

  test('ApiError includes structured error codes', async () => {
    mockFetch(balancesErrorXml);

    const client = new NamecheapClient(mockCredentials, true);

    try {
      await getBalances(client);
      expect.unreachable('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      const apiError = error as ApiError;
      expect(apiError.errors).toHaveLength(2);
      expect(apiError.errors[0]?.code).toBe('1010101');
      expect(apiError.errors[0]?.message).toBe('Authentication failed');
      expect(apiError.errors[1]?.code).toBe('2020202');
      expect(apiError.errors[1]?.message).toBe('Invalid API key');
    }
  });
});

describe('getPricing', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('returns array of pricing info', async () => {
    mockFetch(pricingSuccessXml);

    const client = new NamecheapClient(mockCredentials, true);
    const pricing = await getPricing(client, { action: 'register' });

    expect(pricing).toBeArray();
    expect(pricing.length).toBeGreaterThan(0);
  });

  test('parses pricing fields correctly', async () => {
    mockFetch(pricingSuccessXml);

    const client = new NamecheapClient(mockCredentials, true);
    const pricing = await getPricing(client, { action: 'register' });

    const comPricing = pricing.find((p) => p.productName === 'com');
    expect(comPricing).toBeDefined();
    expect(comPricing?.productType).toBe('DOMAIN');
    expect(comPricing?.productCategory).toBe('register');
    expect(comPricing?.price).toBe(8.88);
    expect(comPricing?.additionalCost).toBe(0.18);
    expect(comPricing?.regularPrice).toBe(10.98);
    expect(comPricing?.yourPrice).toBe(9.06);
    expect(comPricing?.yourPriceType).toBe('COUPON');
    expect(comPricing?.currency).toBe('USD');
    expect(comPricing?.duration).toBe(1);
  });

  test('filters by years option', async () => {
    mockFetch(pricingSuccessXml);

    const client = new NamecheapClient(mockCredentials, true);
    const pricing = await getPricing(client, { action: 'register', years: 2 });

    expect(pricing.length).toBe(1);
    expect(pricing[0]?.duration).toBe(2);
    expect(pricing[0]?.price).toBe(17.76);
  });

  test('defaults to 1 year when years not specified', async () => {
    mockFetch(pricingSuccessXml);

    const client = new NamecheapClient(mockCredentials, true);
    const pricing = await getPricing(client, { action: 'register' });

    pricing.forEach((p) => {
      expect(p.duration).toBe(1);
    });
  });

  test('sends correct API parameters for action', async () => {
    const fetchMock = mockFetch(pricingSuccessXml);

    const client = new NamecheapClient(mockCredentials, true);
    await getPricing(client, { action: 'renew' });

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('ActionName=RENEW');
    expect(callUrl).toContain('ProductType=DOMAIN');
  });

  test('sends TLD parameter when specified', async () => {
    const fetchMock = mockFetch(pricingSuccessXml);

    const client = new NamecheapClient(mockCredentials, true);
    await getPricing(client, { action: 'register', tld: 'com' });

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('ProductName=com');
  });

  test('strips leading dot from TLD', async () => {
    const fetchMock = mockFetch(pricingSuccessXml);

    const client = new NamecheapClient(mockCredentials, true);
    await getPricing(client, { action: 'register', tld: '.com' });

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('ProductName=com');
    expect(callUrl).not.toContain('ProductName=.com');
  });

  test('handles multiple product categories', async () => {
    mockFetch(pricingMultipleCategoriesXml);

    const client = new NamecheapClient(mockCredentials, true);
    const pricing = await getPricing(client, { action: 'register' });

    const categories = [...new Set(pricing.map((p) => p.productCategory))];
    expect(categories).toContain('register');
    expect(categories).toContain('renew');
  });

  test('returns empty array for empty pricing response', async () => {
    mockFetch(pricingEmptyXml);

    const client = new NamecheapClient(mockCredentials, true);
    const pricing = await getPricing(client, { action: 'register' });

    expect(pricing).toBeArray();
    expect(pricing.length).toBe(0);
  });

  test('throws ApiError on API failure', async () => {
    mockFetch(pricingErrorXml);

    const client = new NamecheapClient(mockCredentials, true);

    await expect(getPricing(client, { action: 'register' })).rejects.toThrow(ApiError);
  });

  test('ApiError includes structured error code', async () => {
    mockFetch(pricingErrorXml);

    const client = new NamecheapClient(mockCredentials, true);

    try {
      await getPricing(client, { action: 'register' });
      expect.unreachable('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      const apiError = error as ApiError;
      expect(apiError.errors[0]?.code).toBe('3030303');
    }
  });

  test('handles transfer action', async () => {
    const fetchMock = mockFetch(pricingSuccessXml);

    const client = new NamecheapClient(mockCredentials, true);
    await getPricing(client, { action: 'transfer' });

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('ActionName=TRANSFER');
  });

  test('handles restore action', async () => {
    const fetchMock = mockFetch(pricingSuccessXml);

    const client = new NamecheapClient(mockCredentials, true);
    await getPricing(client, { action: 'restore' });

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('ActionName=RESTORE');
  });

  test('parses multiple products correctly', async () => {
    mockFetch(pricingSuccessXml);

    const client = new NamecheapClient(mockCredentials, true);
    const pricing = await getPricing(client, { action: 'register' });

    const productNames = pricing.map((p) => p.productName);
    expect(productNames).toContain('com');
    expect(productNames).toContain('net');
  });
});
