import { describe, expect, test } from 'bun:test';
import {
  parseDomain,
  getRegistrableDomain,
  isSubdomain,
  getSubdomain,
} from '../../src/utils/domain.js';

describe('parseDomain', () => {
  test('parses simple .com domain', () => {
    const result = parseDomain('example.com');
    expect(result.sld).toBe('example');
    expect(result.tld).toBe('com');
    expect(result.fullDomain).toBe('example.com');
  });

  test('parses .org domain', () => {
    const result = parseDomain('mysite.org');
    expect(result.sld).toBe('mysite');
    expect(result.tld).toBe('org');
    expect(result.fullDomain).toBe('mysite.org');
  });

  test('parses .net domain', () => {
    const result = parseDomain('company.net');
    expect(result.sld).toBe('company');
    expect(result.tld).toBe('net');
  });

  test('parses multi-part TLD .co.uk', () => {
    const result = parseDomain('example.co.uk');
    expect(result.sld).toBe('example');
    expect(result.tld).toBe('co.uk');
    expect(result.fullDomain).toBe('example.co.uk');
  });

  test('parses multi-part TLD .com.au', () => {
    const result = parseDomain('business.com.au');
    expect(result.sld).toBe('business');
    expect(result.tld).toBe('com.au');
    expect(result.fullDomain).toBe('business.com.au');
  });

  test('parses multi-part TLD .org.uk', () => {
    const result = parseDomain('charity.org.uk');
    expect(result.sld).toBe('charity');
    expect(result.tld).toBe('org.uk');
  });

  test('strips subdomain from simple domain', () => {
    const result = parseDomain('www.example.com');
    expect(result.sld).toBe('example');
    expect(result.tld).toBe('com');
    expect(result.fullDomain).toBe('example.com');
  });

  test('strips subdomain from multi-part TLD', () => {
    const result = parseDomain('www.example.co.uk');
    expect(result.sld).toBe('example');
    expect(result.tld).toBe('co.uk');
    expect(result.fullDomain).toBe('example.co.uk');
  });

  test('strips nested subdomains', () => {
    const result = parseDomain('api.v2.example.com');
    expect(result.sld).toBe('example');
    expect(result.tld).toBe('com');
    expect(result.fullDomain).toBe('example.com');
  });

  test('handles domain with hyphens', () => {
    const result = parseDomain('my-cool-site.com');
    expect(result.sld).toBe('my-cool-site');
    expect(result.tld).toBe('com');
  });

  test('handles domain with numbers', () => {
    const result = parseDomain('site123.io');
    expect(result.sld).toBe('site123');
    expect(result.tld).toBe('io');
  });

  test('throws for empty string', () => {
    expect(() => parseDomain('')).toThrow('Domain name is required');
  });

  test('throws for invalid domain', () => {
    expect(() => parseDomain('notadomain')).toThrow('Invalid domain format');
  });

  test('throws for TLD only', () => {
    expect(() => parseDomain('com')).toThrow('Invalid domain format');
  });
});

describe('getRegistrableDomain', () => {
  test('returns same for apex domain', () => {
    expect(getRegistrableDomain('example.com')).toBe('example.com');
  });

  test('strips www subdomain', () => {
    expect(getRegistrableDomain('www.example.com')).toBe('example.com');
  });

  test('strips arbitrary subdomain', () => {
    expect(getRegistrableDomain('blog.example.com')).toBe('example.com');
  });

  test('strips multiple subdomains', () => {
    expect(getRegistrableDomain('a.b.c.example.com')).toBe('example.com');
  });

  test('handles multi-part TLD', () => {
    expect(getRegistrableDomain('www.example.co.uk')).toBe('example.co.uk');
  });
});

describe('isSubdomain', () => {
  test('returns false for apex domain', () => {
    expect(isSubdomain('example.com')).toBe(false);
  });

  test('returns true for www subdomain', () => {
    expect(isSubdomain('www.example.com')).toBe(true);
  });

  test('returns true for arbitrary subdomain', () => {
    expect(isSubdomain('api.example.com')).toBe(true);
  });

  test('returns true for nested subdomain', () => {
    expect(isSubdomain('a.b.example.com')).toBe(true);
  });

  test('returns false for multi-part TLD apex', () => {
    expect(isSubdomain('example.co.uk')).toBe(false);
  });

  test('returns true for subdomain with multi-part TLD', () => {
    expect(isSubdomain('www.example.co.uk')).toBe(true);
  });
});

describe('getSubdomain', () => {
  test('returns null for apex domain', () => {
    expect(getSubdomain('example.com')).toBeNull();
  });

  test('returns www for www subdomain', () => {
    expect(getSubdomain('www.example.com')).toBe('www');
  });

  test('returns full subdomain prefix for nested', () => {
    expect(getSubdomain('a.b.example.com')).toBe('a.b');
  });

  test('returns null for multi-part TLD apex', () => {
    expect(getSubdomain('example.co.uk')).toBeNull();
  });

  test('returns subdomain for multi-part TLD with subdomain', () => {
    expect(getSubdomain('blog.example.co.uk')).toBe('blog');
  });
});
