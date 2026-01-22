import { parse } from 'tldts';

export interface ParsedDomain {
  sld: string;
  tld: string;
  fullDomain: string;
}

/**
 * Parse a domain into SLD (second-level domain) and TLD components
 * for use with Namecheap API.
 *
 * Examples:
 * - example.com -> { sld: 'example', tld: 'com' }
 * - example.co.uk -> { sld: 'example', tld: 'co.uk' }
 * - sub.example.com -> { sld: 'example', tld: 'com' } (subdomain stripped)
 *
 * @throws Error if domain is invalid or not a registrable domain
 */
export function parseDomain(fullDomain: string): ParsedDomain {
  if (!fullDomain) {
    throw new Error('Domain name is required');
  }

  const result = parse(fullDomain);

  if (!result.domain) {
    throw new Error(`Invalid domain format: ${fullDomain}`);
  }

  if (!result.domainWithoutSuffix || !result.publicSuffix) {
    throw new Error(`Unable to parse domain: ${fullDomain}`);
  }

  return {
    sld: result.domainWithoutSuffix,
    tld: result.publicSuffix,
    fullDomain: result.domain,
  };
}

/**
 * Extract the registrable domain from any input (including subdomains).
 * Returns the apex/root domain that would be registered with a registrar.
 *
 * Examples:
 * - example.com -> example.com
 * - www.example.com -> example.com
 * - sub.example.co.uk -> example.co.uk
 */
export function getRegistrableDomain(input: string): string {
  const { fullDomain } = parseDomain(input);
  return fullDomain;
}

/**
 * Check if the input is a subdomain (has hostname prefix before registrable domain).
 */
export function isSubdomain(input: string): boolean {
  const result = parse(input);
  return !!result.subdomain;
}

/**
 * Get the subdomain prefix if present, or null.
 * Example: www.example.com -> 'www'
 */
export function getSubdomain(input: string): string | null {
  const result = parse(input);
  return result.subdomain || null;
}
