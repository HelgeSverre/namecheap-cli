import { describe, expect, test, mock, beforeEach, afterEach } from 'bun:test';
import { NamecheapClient } from '../../../src/lib/api/client.js';
import {
  getBalances,
  getPricing,
  changePassword,
  updateUser,
  createAddFundsRequest,
  getAddFundsStatus,
  createUser,
  loginUser,
  resetPassword,
} from '../../../src/lib/api/users.js';
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

const changePasswordSuccessXml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.users.changePassword">
    <UserChangePasswordResult Success="true" UserId="12345" />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;

const userUpdateSuccessXml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.users.update">
    <UserUpdateResult Success="true" UserId="12345" />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;

const addFundsRequestSuccessXml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.users.createaddfundsrequest">
    <Createaddfundsrequestresult TokenId="abc123token" RedirectURL="https://pay.namecheap.com/checkout/abc123" ReturnURL="https://example.com/return" />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;

const getAddFundsStatusSuccessXml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.users.getAddFundsStatus">
    <GetAddFundsStatusResult TransactionId="TXN987654" Amount="50.00" Status="COMPLETED" />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;

const createUserSuccessXml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.users.create">
    <UserCreateResult Success="true" UserId="67890" />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;

const loginUserSuccessXml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.users.login">
    <UserLoginResult UserName="johndoe" LoginSuccess="true" />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;

const loginUserFailedXml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.users.login">
    <UserLoginResult UserName="johndoe" LoginSuccess="false" />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;

const resetPasswordSuccessXml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings />
  <CommandResponse Type="namecheap.users.resetPassword">
    <UserResetPasswordResult Success="true" />
  </CommandResponse>
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

describe('changePassword', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('returns success and userId with old password flow', async () => {
    mockFetch(changePasswordSuccessXml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await changePassword(client, {
      oldPassword: 'oldPass123',
      newPassword: 'newPass456',
    });

    expect(result.success).toBe(true);
    expect(result.userId).toBe('12345');
  });

  test('sends correct params for old password flow', async () => {
    const fetchMock = mockFetch(changePasswordSuccessXml);

    const client = new NamecheapClient(mockCredentials, true);
    await changePassword(client, {
      oldPassword: 'oldPass123',
      newPassword: 'newPass456',
    });

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('OldPassword=oldPass123');
    expect(callUrl).toContain('NewPassword=newPass456');
  });

  test('sends correct params for reset code flow', async () => {
    const fetchMock = mockFetch(changePasswordSuccessXml);

    const client = new NamecheapClient(mockCredentials, true);
    await changePassword(client, {
      resetCode: 'RESET123',
      newPassword: 'newPass456',
    });

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('ResetCode=RESET123');
    expect(callUrl).toContain('NewPassword=newPass456');
    expect(callUrl).not.toContain('OldPassword');
  });
});

describe('updateUser', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('returns success and userId', async () => {
    mockFetch(userUpdateSuccessXml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await updateUser(client, {
      firstName: 'John',
      lastName: 'Doe',
      address1: '123 Main St',
      city: 'New York',
      stateProvince: 'NY',
      zip: '10001',
      country: 'US',
      email: 'john@example.com',
      phone: '+1.5551234567',
    });

    expect(result.success).toBe(true);
    expect(result.userId).toBe('12345');
  });

  test('sends all required user fields', async () => {
    const fetchMock = mockFetch(userUpdateSuccessXml);

    const client = new NamecheapClient(mockCredentials, true);
    await updateUser(client, {
      firstName: 'John',
      lastName: 'Doe',
      address1: '123 Main St',
      city: 'New York',
      stateProvince: 'NY',
      zip: '10001',
      country: 'US',
      email: 'john@example.com',
      phone: '+1.5551234567',
    });

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('FirstName=John');
    expect(callUrl).toContain('LastName=Doe');
    expect(callUrl).toContain('Address1=123');
    expect(callUrl).toContain('City=New');
    expect(callUrl).toContain('StateProvince=NY');
    expect(callUrl).toContain('Zip=10001');
    expect(callUrl).toContain('Country=US');
    expect(callUrl).toContain('EmailAddress=john');
    expect(callUrl).toContain('Phone=');
  });

  test('sends optional fields when provided', async () => {
    const fetchMock = mockFetch(userUpdateSuccessXml);

    const client = new NamecheapClient(mockCredentials, true);
    await updateUser(client, {
      firstName: 'John',
      lastName: 'Doe',
      jobTitle: 'Developer',
      organization: 'Acme Inc',
      address1: '123 Main St',
      address2: 'Suite 100',
      city: 'New York',
      stateProvince: 'NY',
      zip: '10001',
      country: 'US',
      email: 'john@example.com',
      phone: '+1.5551234567',
      phoneExt: '123',
      fax: '+1.5559876543',
    });

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('JobTitle=Developer');
    expect(callUrl).toContain('Organization=Acme');
    expect(callUrl).toContain('Address2=Suite');
    expect(callUrl).toContain('PhoneExt=123');
    expect(callUrl).toContain('Fax=');
  });
});

describe('createAddFundsRequest', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('returns tokenId, redirectUrl, and returnUrl', async () => {
    mockFetch(addFundsRequestSuccessXml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await createAddFundsRequest(client, {
      username: 'testuser',
      amount: 50,
      returnUrl: 'https://example.com/return',
    });

    expect(result.tokenId).toBe('abc123token');
    expect(result.redirectUrl).toBe('https://pay.namecheap.com/checkout/abc123');
    expect(result.returnUrl).toBe('https://example.com/return');
  });

  test('sends correct params', async () => {
    const fetchMock = mockFetch(addFundsRequestSuccessXml);

    const client = new NamecheapClient(mockCredentials, true);
    await createAddFundsRequest(client, {
      username: 'testuser',
      amount: 50,
      returnUrl: 'https://example.com/return',
    });

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('Username=testuser');
    expect(callUrl).toContain('Amount=50');
    expect(callUrl).toContain('PaymentType=Creditcard');
    expect(callUrl).toContain('ReturnUrl=');
  });
});

describe('getAddFundsStatus', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('returns transactionId, amount, and status', async () => {
    mockFetch(getAddFundsStatusSuccessXml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await getAddFundsStatus(client, 'abc123token');

    expect(result.transactionId).toBe('TXN987654');
    expect(result.amount).toBe(50);
    expect(result.status).toBe('COMPLETED');
  });

  test('sends tokenId param', async () => {
    const fetchMock = mockFetch(getAddFundsStatusSuccessXml);

    const client = new NamecheapClient(mockCredentials, true);
    await getAddFundsStatus(client, 'abc123token');

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('TokenId=abc123token');
  });
});

describe('createUser', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('returns success and userId', async () => {
    mockFetch(createUserSuccessXml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await createUser(client, {
      username: 'newuser',
      password: 'password123',
      email: 'new@example.com',
      acceptTerms: true,
      firstName: 'Jane',
      lastName: 'Doe',
      address1: '456 Oak Ave',
      city: 'Los Angeles',
      stateProvince: 'CA',
      zip: '90001',
      country: 'US',
      phone: '+1.5559998888',
    });

    expect(result.success).toBe(true);
    expect(result.userId).toBe('67890');
  });

  test('sends all required fields', async () => {
    const fetchMock = mockFetch(createUserSuccessXml);

    const client = new NamecheapClient(mockCredentials, true);
    await createUser(client, {
      username: 'newuser',
      password: 'password123',
      email: 'new@example.com',
      acceptTerms: true,
      firstName: 'Jane',
      lastName: 'Doe',
      address1: '456 Oak Ave',
      city: 'Los Angeles',
      stateProvince: 'CA',
      zip: '90001',
      country: 'US',
      phone: '+1.5559998888',
    });

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('NewUserName=newuser');
    expect(callUrl).toContain('NewUserPassword=password123');
    expect(callUrl).toContain('EmailAddress=new');
    expect(callUrl).toContain('AcceptTerms=1');
    expect(callUrl).toContain('FirstName=Jane');
    expect(callUrl).toContain('LastName=Doe');
    expect(callUrl).toContain('Address1=456');
    expect(callUrl).toContain('City=Los');
    expect(callUrl).toContain('StateProvince=CA');
    expect(callUrl).toContain('Zip=90001');
    expect(callUrl).toContain('Country=US');
    expect(callUrl).toContain('Phone=');
  });

  test('sends optional fields when provided', async () => {
    const fetchMock = mockFetch(createUserSuccessXml);

    const client = new NamecheapClient(mockCredentials, true);
    await createUser(client, {
      username: 'newuser',
      password: 'password123',
      email: 'new@example.com',
      ignoreDuplicateEmail: true,
      acceptTerms: true,
      acceptNews: false,
      firstName: 'Jane',
      lastName: 'Doe',
      jobTitle: 'Manager',
      organization: 'Corp Inc',
      address1: '456 Oak Ave',
      address2: 'Floor 2',
      city: 'Los Angeles',
      stateProvince: 'CA',
      zip: '90001',
      country: 'US',
      phone: '+1.5559998888',
      phoneExt: '456',
      fax: '+1.5557776666',
    });

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('IgnoreDuplicateEmailAddress=yes');
    expect(callUrl).toContain('AcceptNews=0');
    expect(callUrl).toContain('JobTitle=Manager');
    expect(callUrl).toContain('Organization=Corp');
    expect(callUrl).toContain('Address2=Floor');
    expect(callUrl).toContain('PhoneExt=456');
    expect(callUrl).toContain('Fax=');
  });
});

describe('loginUser', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('returns username and loginSuccess on successful login', async () => {
    mockFetch(loginUserSuccessXml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await loginUser(client, 'johndoe', 'password123');

    expect(result.username).toBe('johndoe');
    expect(result.loginSuccess).toBe(true);
  });

  test('returns loginSuccess false on failed login', async () => {
    mockFetch(loginUserFailedXml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await loginUser(client, 'johndoe', 'wrongpassword');

    expect(result.username).toBe('johndoe');
    expect(result.loginSuccess).toBe(false);
  });

  test('sends correct params', async () => {
    const fetchMock = mockFetch(loginUserSuccessXml);

    const client = new NamecheapClient(mockCredentials, true);
    await loginUser(client, 'johndoe', 'password123');

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('UserName=johndoe');
    expect(callUrl).toContain('Password=password123');
  });
});

describe('resetPassword', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('returns success', async () => {
    mockFetch(resetPasswordSuccessXml);

    const client = new NamecheapClient(mockCredentials, true);
    const result = await resetPassword(client, {
      findBy: 'EMAILADDRESS',
      findByValue: 'user@example.com',
    });

    expect(result.success).toBe(true);
  });

  test('sends correct params with EMAILADDRESS findBy', async () => {
    const fetchMock = mockFetch(resetPasswordSuccessXml);

    const client = new NamecheapClient(mockCredentials, true);
    await resetPassword(client, {
      findBy: 'EMAILADDRESS',
      findByValue: 'user@example.com',
    });

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('FindBy=EMAILADDRESS');
    expect(callUrl).toContain('FindByValue=user');
  });

  test('sends correct params with DOMAINNAME findBy', async () => {
    const fetchMock = mockFetch(resetPasswordSuccessXml);

    const client = new NamecheapClient(mockCredentials, true);
    await resetPassword(client, {
      findBy: 'DOMAINNAME',
      findByValue: 'example.com',
    });

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('FindBy=DOMAINNAME');
    expect(callUrl).toContain('FindByValue=example.com');
  });

  test('sends correct params with USERNAME findBy', async () => {
    const fetchMock = mockFetch(resetPasswordSuccessXml);

    const client = new NamecheapClient(mockCredentials, true);
    await resetPassword(client, {
      findBy: 'USERNAME',
      findByValue: 'johndoe',
    });

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('FindBy=USERNAME');
    expect(callUrl).toContain('FindByValue=johndoe');
  });

  test('sends optional email params when provided', async () => {
    const fetchMock = mockFetch(resetPasswordSuccessXml);

    const client = new NamecheapClient(mockCredentials, true);
    await resetPassword(client, {
      findBy: 'EMAILADDRESS',
      findByValue: 'user@example.com',
      emailFromName: 'Support Team',
      emailFrom: 'support@company.com',
      urlPattern: 'https://company.com/reset?code=[RESETCODE]',
    });

    const calls = fetchMock.mock.calls as unknown as [string][];
    const callUrl = calls[0]?.[0] ?? '';
    expect(callUrl).toContain('EmailFromName=Support');
    expect(callUrl).toContain('EmailFrom=support');
    expect(callUrl).toContain('URLPattern=');
  });
});
