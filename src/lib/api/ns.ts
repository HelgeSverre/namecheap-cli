import { NamecheapClient } from './client.js';

// Child Nameserver Types
export interface ChildNameserver {
  nameserver: string;
  ip: string;
  statuses: string[];
}

function parseDomain(fullDomain: string): { sld: string; tld: string } {
  const parts = fullDomain.split('.');
  if (parts.length < 2) {
    throw new Error(`Invalid domain format: ${fullDomain}`);
  }
  // Simple case: domain.tld
  if (parts.length === 2) {
    return {
      sld: parts[0]!,
      tld: parts[1]!,
    };
  }
  // Complex case: treat as sld.tld
  return {
    sld: parts.slice(0, -1).join('.'),
    tld: parts[parts.length - 1]!,
  };
}

export async function createChildNameserver(
  client: NamecheapClient,
  domain: string,
  nameserver: string,
  ip: string,
): Promise<boolean> {
  const { sld, tld } = parseDomain(domain);

  const response = await client.request('namecheap.domains.ns.create', {
    SLD: sld,
    TLD: tld,
    Nameserver: nameserver,
    IP: ip,
  });

  NamecheapClient.handleResponse(response);
  return true;
}

export async function deleteChildNameserver(
  client: NamecheapClient,
  domain: string,
  nameserver: string,
): Promise<boolean> {
  const { sld, tld } = parseDomain(domain);

  const response = await client.request('namecheap.domains.ns.delete', {
    SLD: sld,
    TLD: tld,
    Nameserver: nameserver,
  });

  NamecheapClient.handleResponse(response);
  return true;
}

export async function getChildNameserverInfo(
  client: NamecheapClient,
  domain: string,
  nameserver: string,
): Promise<ChildNameserver> {
  const { sld, tld } = parseDomain(domain);

  const response = await client.request('namecheap.domains.ns.getInfo', {
    SLD: sld,
    TLD: tld,
    Nameserver: nameserver,
  });

  const data = NamecheapClient.handleResponse(response) as {
    DomainNSInfoResult?: {
      '@_Nameserver': string;
      '@_IP': string;
      Nameserver?: string;
      IP?: string;
      NameserverStatuses?: {
        Status?: string | string[];
      };
    };
  };

  const result = data.DomainNSInfoResult;
  if (!result) {
    throw new Error('No nameserver info returned from API');
  }

  let statuses: string[] = [];
  if (result.NameserverStatuses?.Status) {
    statuses = Array.isArray(result.NameserverStatuses.Status)
      ? result.NameserverStatuses.Status
      : [result.NameserverStatuses.Status];
  }

  return {
    nameserver: result['@_Nameserver'] || result.Nameserver || nameserver,
    ip: result['@_IP'] || result.IP || '',
    statuses,
  };
}

export async function updateChildNameserver(
  client: NamecheapClient,
  domain: string,
  nameserver: string,
  oldIp: string,
  newIp: string,
): Promise<boolean> {
  const { sld, tld } = parseDomain(domain);

  const response = await client.request('namecheap.domains.ns.update', {
    SLD: sld,
    TLD: tld,
    Nameserver: nameserver,
    OldIP: oldIp,
    IP: newIp,
  });

  NamecheapClient.handleResponse(response);
  return true;
}
