import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  parseApiResponse,
  parseDomainList,
  parseDomainInfo,
  parseDomainCheck,
  parseDnsHosts,
  parseNameservers,
  parseUserBalances,
  parseUserPricing,
} from '../../../src/lib/api/parser.js';

const fixturesDir = join(import.meta.dir, '../../fixtures');

function loadFixture(name: string): string {
  return readFileSync(join(fixturesDir, name), 'utf-8');
}

describe('parseApiResponse', () => {
  test('parses successful response', () => {
    const xml = loadFixture('domain-list.xml');
    const response = parseApiResponse(xml);

    expect(response.success).toBe(true);
    expect(response.errors).toEqual([]);
    expect(response.warnings).toEqual([]);
    expect(response.data).toBeDefined();
  });

  test('parses error response', () => {
    const xml = loadFixture('error-response.xml');
    const response = parseApiResponse(xml);

    expect(response.success).toBe(false);
    expect(response.errors.length).toBeGreaterThan(0);
    expect(response.errors[0]?.code).toBe('2019166');
    expect(response.errors[0]?.message).toContain('Domain not found');
  });

  test('parses response with warnings', () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK" xmlns="http://api.namecheap.com/xml.response">
  <Errors />
  <Warnings>
    <Warning>This is a warning message</Warning>
  </Warnings>
  <RequestedCommand>namecheap.domains.getlist</RequestedCommand>
  <CommandResponse>
    <DomainGetListResult />
  </CommandResponse>
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.5</ExecutionTime>
</ApiResponse>`;
    const response = parseApiResponse(xml);

    expect(response.success).toBe(true);
    expect(response.warnings.length).toBe(1);
    expect(response.warnings[0]).toBe('This is a warning message');
  });

  test('parses response with multiple errors', () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="ERROR" xmlns="http://api.namecheap.com/xml.response">
  <Errors>
    <Error Number="1011102">Invalid API Key</Error>
    <Error Number="1011151">IP not whitelisted</Error>
  </Errors>
  <Warnings />
  <CommandResponse />
  <Server>PHX01APIEXT05</Server>
  <ExecutionTime>0.1</ExecutionTime>
</ApiResponse>`;
    const response = parseApiResponse(xml);

    expect(response.success).toBe(false);
    expect(response.errors.length).toBe(2);
    expect(response.errors[0]?.code).toBe('1011102');
    expect(response.errors[1]?.code).toBe('1011151');
  });
});

describe('parseDomainList', () => {
  test('parses multiple domains', () => {
    const xml = loadFixture('domain-list.xml');
    const response = parseApiResponse(xml);
    const result = parseDomainList(response.data);

    expect(result.domains.length).toBe(2);
    expect((result.domains[0] as any)['@_Name']).toBe('example.com');
    expect((result.domains[1] as any)['@_Name']).toBe('test-domain.org');
  });

  test('parses single domain', () => {
    const data = {
      DomainGetListResult: {
        Domain: { '@_ID': 1, '@_Name': 'single.com' },
      },
    };
    const result = parseDomainList(data);

    expect(result.domains.length).toBe(1);
    expect((result.domains[0] as any)['@_Name']).toBe('single.com');
  });

  test('returns empty array for no domains', () => {
    const data = {
      DomainGetListResult: {},
    };
    const result = parseDomainList(data);

    expect(result.domains).toEqual([]);
  });

  test('returns empty array for undefined data', () => {
    const result = parseDomainList(undefined);
    expect(result.domains).toEqual([]);
  });

  test('parses totalItems from Paging', () => {
    const data = {
      DomainGetListResult: {
        Domain: { '@_ID': 1, '@_Name': 'single.com' },
      },
      Paging: {
        TotalItems: 50,
        CurrentPage: 1,
        PageSize: 20,
      },
    };
    const result = parseDomainList(data);

    expect(result.totalItems).toBe(50);
    expect(result.domains.length).toBe(1);
  });

  test('falls back to domains length when no Paging', () => {
    const data = {
      DomainGetListResult: {
        Domain: [
          { '@_ID': 1, '@_Name': 'a.com' },
          { '@_ID': 2, '@_Name': 'b.com' },
        ],
      },
    };
    const result = parseDomainList(data);

    expect(result.totalItems).toBe(2);
  });
});

describe('parseDomainInfo', () => {
  test('parses domain info', () => {
    const xml = loadFixture('domain-info.xml');
    const response = parseApiResponse(xml);
    const info = parseDomainInfo(response.data);

    expect(info).toBeDefined();
    expect((info as any)['@_DomainName']).toBe('example.com');
    expect((info as any)['@_OwnerName']).toBe('testuser');
    expect((info as any)['@_Status']).toBe('Ok');
  });

  test('includes WhoisGuard info', () => {
    const xml = loadFixture('domain-info.xml');
    const response = parseApiResponse(xml);
    const info = parseDomainInfo(response.data) as any;

    expect(info.Whoisguard).toBeDefined();
    expect(info.Whoisguard['@_Enabled']).toBe(true);
  });

  test('includes DNS details', () => {
    const xml = loadFixture('domain-info.xml');
    const response = parseApiResponse(xml);
    const info = parseDomainInfo(response.data) as any;

    expect(info.DnsDetails).toBeDefined();
    expect(info.DnsDetails['@_ProviderType']).toBe('CUSTOM');
  });

  test('returns undefined for missing DomainGetInfoResult', () => {
    const result = parseDomainInfo({});
    expect(result).toBeUndefined();
  });
});

describe('parseDomainCheck', () => {
  test('parses multiple domain checks', () => {
    const xml = loadFixture('domain-check.xml');
    const response = parseApiResponse(xml);
    const results = parseDomainCheck(response.data);

    expect(results.length).toBe(3);
  });

  test('parses available domain', () => {
    const xml = loadFixture('domain-check.xml');
    const response = parseApiResponse(xml);
    const results = parseDomainCheck(response.data);

    const available = results.find((r: any) => r['@_Domain'] === 'available-domain.com') as any;
    expect(available['@_Available']).toBe(true);
    expect(available['@_IsPremiumName']).toBe(false);
  });

  test('parses unavailable domain', () => {
    const xml = loadFixture('domain-check.xml');
    const response = parseApiResponse(xml);
    const results = parseDomainCheck(response.data);

    const unavailable = results.find((r: any) => r['@_Domain'] === 'example.com') as any;
    expect(unavailable['@_Available']).toBe(false);
  });

  test('parses premium domain with pricing', () => {
    const xml = loadFixture('domain-check.xml');
    const response = parseApiResponse(xml);
    const results = parseDomainCheck(response.data);

    const premium = results.find((r: any) => r['@_Domain'] === 'premium-domain.io') as any;
    expect(premium['@_IsPremiumName']).toBe(true);
    expect(premium['@_PremiumRegistrationPrice']).toBe(1500);
  });

  test('returns empty array for no results', () => {
    const results = parseDomainCheck({});
    expect(results).toEqual([]);
  });
});

describe('parseDnsHosts', () => {
  test('parses multiple DNS records', () => {
    const xml = loadFixture('dns-hosts.xml');
    const response = parseApiResponse(xml);
    const hosts = parseDnsHosts(response.data);

    expect(hosts.length).toBe(4);
  });

  test('parses A record', () => {
    const xml = loadFixture('dns-hosts.xml');
    const response = parseApiResponse(xml);
    const hosts = parseDnsHosts(response.data);

    const aRecord = hosts.find((h: any) => h['@_Type'] === 'A') as any;
    expect(aRecord).toBeDefined();
    expect(aRecord['@_Name']).toBe('@');
    expect(aRecord['@_Address']).toBe('192.168.1.1');
    expect(aRecord['@_TTL']).toBe(1800);
  });

  test('parses CNAME record', () => {
    const xml = loadFixture('dns-hosts.xml');
    const response = parseApiResponse(xml);
    const hosts = parseDnsHosts(response.data);

    const cnameRecord = hosts.find((h: any) => h['@_Type'] === 'CNAME') as any;
    expect(cnameRecord).toBeDefined();
    expect(cnameRecord['@_Name']).toBe('www');
    expect(cnameRecord['@_Address']).toBe('example.com.');
  });

  test('parses MX record with priority', () => {
    const xml = loadFixture('dns-hosts.xml');
    const response = parseApiResponse(xml);
    const hosts = parseDnsHosts(response.data);

    const mxRecord = hosts.find((h: any) => h['@_Type'] === 'MX') as any;
    expect(mxRecord).toBeDefined();
    expect(mxRecord['@_MXPref']).toBe(10);
  });

  test('parses TXT record', () => {
    const xml = loadFixture('dns-hosts.xml');
    const response = parseApiResponse(xml);
    const hosts = parseDnsHosts(response.data);

    const txtRecord = hosts.find((h: any) => h['@_Type'] === 'TXT') as any;
    expect(txtRecord).toBeDefined();
    expect(txtRecord['@_Address']).toContain('spf1');
  });

  test('returns empty array for no hosts', () => {
    const hosts = parseDnsHosts({});
    expect(hosts).toEqual([]);
  });

  test('handles single host', () => {
    const data = {
      DomainDNSGetHostsResult: {
        host: { '@_HostId': '1', '@_Name': '@', '@_Type': 'A', '@_Address': '1.2.3.4' },
      },
    };
    const hosts = parseDnsHosts(data);

    expect(hosts.length).toBe(1);
    expect((hosts[0] as any)['@_Address']).toBe('1.2.3.4');
  });
});

describe('parseNameservers', () => {
  test('parses nameserver info', () => {
    const xml = loadFixture('nameservers.xml');
    const response = parseApiResponse(xml);
    const nsInfo = parseNameservers(response.data);

    expect(nsInfo).toBeDefined();
    expect((nsInfo as any)['@_IsUsingOurDNS']).toBe(true);
  });

  test('includes nameserver list', () => {
    const xml = loadFixture('nameservers.xml');
    const response = parseApiResponse(xml);
    const nsInfo = parseNameservers(response.data) as any;

    expect(nsInfo.Nameserver).toBeDefined();
    // May be array or single value depending on count
    const nameservers = Array.isArray(nsInfo.Nameserver) ? nsInfo.Nameserver : [nsInfo.Nameserver];
    expect(nameservers.length).toBe(2);
    expect(nameservers[0]).toContain('registrar-servers.com');
  });

  test('returns undefined for missing result', () => {
    const result = parseNameservers({});
    expect(result).toBeUndefined();
  });
});

describe('parseUserBalances', () => {
  test('parses user balances', () => {
    const data = {
      UserGetBalancesResult: {
        '@_Currency': 'USD',
        '@_AvailableBalance': '100.50',
        '@_AccountBalance': '150.00',
        '@_EarnedAmount': '10.00',
      },
    };
    const result = parseUserBalances(data);

    expect(result).toBeDefined();
    expect((result as any)['@_Currency']).toBe('USD');
    expect((result as any)['@_AvailableBalance']).toBe('100.50');
  });

  test('returns undefined for missing result', () => {
    const result = parseUserBalances({});
    expect(result).toBeUndefined();
  });
});

describe('parseUserPricing', () => {
  test('parses user pricing', () => {
    const data = {
      UserGetPricingResult: {
        ProductType: {
          '@_Name': 'DOMAIN',
          ProductCategory: {
            '@_Name': 'REGISTER',
          },
        },
      },
    };
    const result = parseUserPricing(data);

    expect(result).toBeDefined();
    expect((result as any).ProductType['@_Name']).toBe('DOMAIN');
  });

  test('returns undefined for missing result', () => {
    const result = parseUserPricing({});
    expect(result).toBeUndefined();
  });
});
