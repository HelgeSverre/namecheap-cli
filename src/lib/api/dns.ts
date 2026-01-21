import { NamecheapClient } from './client.js';
import { parseDnsHosts, parseNameservers } from './parser.js';
import type { DnsRecord, DnsRecordInput, DnsRecordType, NameserverInfo } from './types.js';

interface RawDnsHost {
  '@_HostId': string | number;
  '@_Name': string;
  '@_Type': DnsRecordType;
  '@_Address': string;
  '@_MXPref'?: number;
  '@_TTL': number;
  '@_IsActive': boolean;
  '@_IsDDNSEnabled'?: boolean;
}

interface RawNameserverInfo {
  '@_Domain': string;
  '@_IsUsingOurDNS': boolean;
  Nameserver?: string | string[];
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

  // Complex case: subdomain.domain.tld - we need the registered domain parts
  return {
    sld: parts.slice(0, -1).join('.'),
    tld: parts[parts.length - 1]!,
  };
}

export async function getDnsHosts(client: NamecheapClient, domain: string): Promise<DnsRecord[]> {
  const { sld, tld } = parseDomain(domain);

  const response = await client.request('namecheap.domains.dns.getHosts', {
    SLD: sld,
    TLD: tld,
  });

  const data = NamecheapClient.handleResponse(response);
  const rawHosts = parseDnsHosts(data) as RawDnsHost[];

  return rawHosts.map((h) => ({
    hostId: String(h['@_HostId']),
    name: h['@_Name'],
    type: h['@_Type'],
    address: h['@_Address'],
    mxPref: h['@_MXPref'],
    ttl: h['@_TTL'],
    isActive: h['@_IsActive'],
    isDDNSEnabled: h['@_IsDDNSEnabled'],
  }));
}

export async function setDnsHosts(
  client: NamecheapClient,
  domain: string,
  records: DnsRecordInput[],
): Promise<boolean> {
  const { sld, tld } = parseDomain(domain);

  const params: Record<string, string | number | boolean> = {
    SLD: sld,
    TLD: tld,
  };

  // Add each record as numbered parameters
  records.forEach((record, index) => {
    const i = index + 1;
    params[`HostName${i}`] = record.name;
    params[`RecordType${i}`] = record.type;
    params[`Address${i}`] = record.address;
    params[`TTL${i}`] = record.ttl || 1800;
    if (record.type === 'MX' && record.mxPref !== undefined) {
      params[`MXPref${i}`] = record.mxPref;
    }
  });

  const response = await client.post('namecheap.domains.dns.setHosts', params);
  NamecheapClient.handleResponse(response);
  return true;
}

export async function addDnsRecord(
  client: NamecheapClient,
  domain: string,
  record: DnsRecordInput,
): Promise<boolean> {
  // Get existing records first
  const existingRecords = await getDnsHosts(client, domain);

  // Convert existing records to input format
  const allRecords: DnsRecordInput[] = existingRecords.map((r) => ({
    name: r.name,
    type: r.type,
    address: r.address,
    mxPref: r.mxPref,
    ttl: r.ttl,
  }));

  // Add the new record
  allRecords.push(record);

  // Set all records
  return setDnsHosts(client, domain, allRecords);
}

export async function updateDnsRecord(
  client: NamecheapClient,
  domain: string,
  hostId: string,
  updates: Partial<DnsRecordInput>,
): Promise<boolean> {
  // Get existing records
  const existingRecords = await getDnsHosts(client, domain);

  // Find and update the target record
  const allRecords: DnsRecordInput[] = existingRecords.map((r) => {
    if (r.hostId === hostId) {
      return {
        name: updates.name ?? r.name,
        type: updates.type ?? r.type,
        address: updates.address ?? r.address,
        mxPref: updates.mxPref ?? r.mxPref,
        ttl: updates.ttl ?? r.ttl,
      };
    }
    return {
      name: r.name,
      type: r.type,
      address: r.address,
      mxPref: r.mxPref,
      ttl: r.ttl,
    };
  });

  return setDnsHosts(client, domain, allRecords);
}

export async function deleteDnsRecord(
  client: NamecheapClient,
  domain: string,
  hostId: string,
): Promise<boolean> {
  // Get existing records
  const existingRecords = await getDnsHosts(client, domain);

  // Filter out the record to delete
  const remainingRecords: DnsRecordInput[] = existingRecords
    .filter((r) => r.hostId !== hostId)
    .map((r) => ({
      name: r.name,
      type: r.type,
      address: r.address,
      mxPref: r.mxPref,
      ttl: r.ttl,
    }));

  if (remainingRecords.length === existingRecords.length) {
    throw new Error(`Record with ID ${hostId} not found`);
  }

  return setDnsHosts(client, domain, remainingRecords);
}

export async function getNameservers(
  client: NamecheapClient,
  domain: string,
): Promise<NameserverInfo> {
  const { sld, tld } = parseDomain(domain);

  const response = await client.request('namecheap.domains.dns.getList', {
    SLD: sld,
    TLD: tld,
  });

  const data = NamecheapClient.handleResponse(response);
  const raw = parseNameservers(data) as RawNameserverInfo;

  let nameservers: string[] = [];
  if (raw.Nameserver) {
    nameservers = Array.isArray(raw.Nameserver) ? raw.Nameserver : [raw.Nameserver];
  }

  return {
    domain: raw['@_Domain'],
    nameservers,
    isUsingOurDns: raw['@_IsUsingOurDNS'],
  };
}

export async function setCustomNameservers(
  client: NamecheapClient,
  domain: string,
  nameservers: string[],
): Promise<boolean> {
  const { sld, tld } = parseDomain(domain);

  const params: Record<string, string | number | boolean> = {
    SLD: sld,
    TLD: tld,
    Nameservers: nameservers.join(','),
  };

  const response = await client.request('namecheap.domains.dns.setCustom', params);
  NamecheapClient.handleResponse(response);
  return true;
}

export async function setDefaultNameservers(
  client: NamecheapClient,
  domain: string,
): Promise<boolean> {
  const { sld, tld } = parseDomain(domain);

  const response = await client.request('namecheap.domains.dns.setDefault', {
    SLD: sld,
    TLD: tld,
  });

  NamecheapClient.handleResponse(response);
  return true;
}

// Email Forwarding
export interface EmailForward {
  mailbox: string;
  forwardTo: string;
}

interface RawEmailForward {
  '@_mailbox': string;
  '@_ForwardTo': string;
}

export async function getEmailForwarding(
  client: NamecheapClient,
  domain: string,
): Promise<EmailForward[]> {
  const response = await client.request('namecheap.domains.dns.getEmailForwarding', {
    DomainName: domain,
  });

  const data = NamecheapClient.handleResponse(response) as {
    DomainDNSGetEmailForwardingResult?: {
      Forward?: RawEmailForward | RawEmailForward[];
    };
  };

  const forwards = data.DomainDNSGetEmailForwardingResult?.Forward;
  if (!forwards) return [];

  const forwardList = Array.isArray(forwards) ? forwards : [forwards];
  return forwardList.map((f) => ({
    mailbox: f['@_mailbox'],
    forwardTo: f['@_ForwardTo'],
  }));
}

export async function setEmailForwarding(
  client: NamecheapClient,
  domain: string,
  forwards: EmailForward[],
): Promise<boolean> {
  const params: Record<string, string | number | boolean> = {
    DomainName: domain,
  };

  // Add each forward as numbered parameters
  forwards.forEach((forward, index) => {
    const i = index + 1;
    params[`MailBox${i}`] = forward.mailbox;
    params[`ForwardTo${i}`] = forward.forwardTo;
  });

  const response = await client.request('namecheap.domains.dns.setEmailForwarding', params);
  NamecheapClient.handleResponse(response);
  return true;
}

export async function addEmailForward(
  client: NamecheapClient,
  domain: string,
  mailbox: string,
  forwardTo: string,
): Promise<boolean> {
  // Get existing forwards
  const existingForwards = await getEmailForwarding(client, domain);

  // Check for duplicate
  const exists = existingForwards.some((f) => f.mailbox.toLowerCase() === mailbox.toLowerCase());
  if (exists) {
    throw new Error(`Email forward for "${mailbox}" already exists`);
  }

  // Add new forward
  existingForwards.push({ mailbox, forwardTo });

  return setEmailForwarding(client, domain, existingForwards);
}

export async function removeEmailForward(
  client: NamecheapClient,
  domain: string,
  mailbox: string,
): Promise<boolean> {
  // Get existing forwards
  const existingForwards = await getEmailForwarding(client, domain);

  // Filter out the forward to remove
  const remainingForwards = existingForwards.filter(
    (f) => f.mailbox.toLowerCase() !== mailbox.toLowerCase(),
  );

  if (remainingForwards.length === existingForwards.length) {
    throw new Error(`Email forward for "${mailbox}" not found`);
  }

  return setEmailForwarding(client, domain, remainingForwards);
}
