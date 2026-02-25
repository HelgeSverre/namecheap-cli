import { NamecheapClient } from './client.js';
import { parseDomainCheck, parseDomainInfo, parseDomainList } from './parser.js';
import type { Domain, DomainAvailability, DomainInfo, PaginationParams } from './types.js';

interface RawDomain {
  '@_ID': number;
  '@_Name': string;
  '@_User': string;
  '@_Created': string;
  '@_Expires': string;
  '@_IsExpired': boolean;
  '@_IsLocked': boolean;
  '@_AutoRenew': boolean;
  '@_WhoisGuard': string;
  '@_IsPremium': boolean;
  '@_IsOurDNS': boolean;
}

interface RawDomainInfo {
  '@_DomainName': string;
  '@_OwnerName': string;
  '@_Status': string;
  '@_IsOwner': boolean;
  '@_IsPremium': boolean;
  DomainDetails?: {
    CreatedDate?: string;
    ExpiredDate?: string;
    NumYears?: number;
  };
  Whoisguard?: {
    '@_Enabled': boolean;
    '@_ID': string;
    ExpiredDate?: string;
  };
  DnsDetails?: {
    '@_ProviderType': string;
    Nameserver?: string | string[];
  };
}

interface RawDomainCheck {
  '@_Domain': string;
  '@_Available': boolean;
  '@_IsPremiumName': boolean;
  '@_PremiumRegistrationPrice'?: number;
  '@_PremiumRenewalPrice'?: number;
  '@_PremiumRestorePrice'?: number;
  '@_PremiumTransferPrice'?: number;
}

export async function listDomains(
  client: NamecheapClient,
  pagination: PaginationParams = {},
): Promise<{ domains: Domain[]; total: number }> {
  const params: Record<string, string | number | boolean> = {};

  if (pagination.page) params.Page = pagination.page;
  if (pagination.pageSize) params.PageSize = pagination.pageSize;

  const response = await client.request('namecheap.domains.getList', params);
  const data = NamecheapClient.handleResponse(response);
  const { domains: rawDomains, totalItems } = parseDomainList(data) as {
    domains: RawDomain[];
    totalItems: number;
  };

  const domains: Domain[] = rawDomains.map((d) => ({
    id: d['@_ID'],
    name: d['@_Name'],
    user: d['@_User'],
    created: d['@_Created'],
    expires: d['@_Expires'],
    isExpired: d['@_IsExpired'],
    isLocked: d['@_IsLocked'],
    autoRenew: d['@_AutoRenew'],
    whoisGuard: d['@_WhoisGuard'],
    isPremium: d['@_IsPremium'],
    isOurDns: d['@_IsOurDNS'],
  }));

  return { domains, total: totalItems };
}

export async function getDomainInfo(client: NamecheapClient, domain: string): Promise<DomainInfo> {
  const response = await client.request('namecheap.domains.getInfo', {
    DomainName: domain,
  });

  const data = NamecheapClient.handleResponse(response);
  const raw = parseDomainInfo(data) as RawDomainInfo;

  return {
    domainName: raw['@_DomainName'],
    ownerName: raw['@_OwnerName'],
    status: raw['@_Status'],
    isOwner: raw['@_IsOwner'],
    isPremium: raw['@_IsPremium'],
    dnsProviderType: raw.DnsDetails?.['@_ProviderType'] || 'Unknown',
    whoisGuard: {
      enabled: raw.Whoisguard?.['@_Enabled'] || false,
      id: raw.Whoisguard?.['@_ID'] || '',
      expiredDate: raw.Whoisguard?.ExpiredDate || '',
    },
    createdDate: raw.DomainDetails?.CreatedDate || '',
    expiredDate: raw.DomainDetails?.ExpiredDate || '',
    modifyDate: '',
  };
}

export async function checkDomainAvailability(
  client: NamecheapClient,
  domains: string[],
): Promise<DomainAvailability[]> {
  const domainList = domains.join(',');

  const response = await client.request('namecheap.domains.check', {
    DomainList: domainList,
  });

  const data = NamecheapClient.handleResponse(response);
  const rawResults = parseDomainCheck(data) as RawDomainCheck[];

  return rawResults.map((r) => ({
    domain: r['@_Domain'],
    available: r['@_Available'],
    premium: r['@_IsPremiumName'],
    premiumPrice: r['@_PremiumRegistrationPrice'],
  }));
}

export async function setRegistrarLock(
  client: NamecheapClient,
  domain: string,
  lock: boolean,
): Promise<boolean> {
  const response = await client.request('namecheap.domains.setRegistrarLock', {
    DomainName: domain,
    LockAction: lock ? 'LOCK' : 'UNLOCK',
  });

  NamecheapClient.handleResponse(response);
  return true;
}

export async function getRegistrarLock(client: NamecheapClient, domain: string): Promise<boolean> {
  const response = await client.request('namecheap.domains.getRegistrarLock', {
    DomainName: domain,
  });

  const data = NamecheapClient.handleResponse(response) as {
    DomainGetRegistrarLockResult?: {
      '@_RegistrarLockStatus': boolean;
    };
  };

  return data.DomainGetRegistrarLockResult?.['@_RegistrarLockStatus'] || false;
}

// Domain Registration
export interface RegisterDomainOptions {
  years?: number;
  nameservers?: string[];
  addFreeWhoisguard?: boolean;
  enableWhoisguard?: boolean;
  autoRenew?: boolean;
  promoCode?: string;
  contacts?: {
    registrant: ContactInfo;
    tech?: ContactInfo;
    admin?: ContactInfo;
    auxBilling?: ContactInfo;
  };
}

export interface ContactInfo {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  phone: string;
  phoneExt?: string;
  fax?: string;
  email: string;
  organizationName?: string;
  jobTitle?: string;
}

export interface RegistrationResult {
  domain: string;
  registered: boolean;
  chargedAmount: number;
  domainId: number;
  orderId: number;
  transactionId: number;
  whoisguardEnabled: boolean;
  nonRealTimeDomain: boolean;
}

export async function registerDomain(
  client: NamecheapClient,
  domain: string,
  options: RegisterDomainOptions = {},
): Promise<RegistrationResult> {
  const params: Record<string, string | number | boolean> = {
    DomainName: domain,
    Years: options.years || 1,
    AddFreeWhoisguard: options.addFreeWhoisguard !== false ? 'yes' : 'no',
    WGEnabled: options.enableWhoisguard !== false ? 'yes' : 'no',
  };

  if (options.nameservers && options.nameservers.length > 0) {
    params.Nameservers = options.nameservers.join(',');
  }

  if (options.promoCode) {
    params.PromotionCode = options.promoCode;
  }

  // Add contacts
  if (options.contacts) {
    const { registrant, tech, admin, auxBilling } = options.contacts;

    // Registrant (required)
    addContactParams(params, 'Registrant', registrant);

    // Tech (default to registrant if not provided)
    addContactParams(params, 'Tech', tech || registrant);

    // Admin (default to registrant if not provided)
    addContactParams(params, 'Admin', admin || registrant);

    // AuxBilling (default to registrant if not provided)
    addContactParams(params, 'AuxBilling', auxBilling || registrant);
  }

  const response = await client.request('namecheap.domains.create', params);
  const data = NamecheapClient.handleResponse(response) as {
    DomainCreateResult?: {
      '@_Domain': string;
      '@_Registered': boolean;
      '@_ChargedAmount': number;
      '@_DomainID': number;
      '@_OrderID': number;
      '@_TransactionID': number;
      '@_WhoisguardEnable': boolean;
      '@_NonRealTimeDomain': boolean;
    };
  };

  const result = data.DomainCreateResult;
  if (!result) {
    throw new Error('No registration result returned from API');
  }

  return {
    domain: result['@_Domain'],
    registered: result['@_Registered'],
    chargedAmount: Number(result['@_ChargedAmount']) || 0,
    domainId: result['@_DomainID'],
    orderId: result['@_OrderID'],
    transactionId: result['@_TransactionID'],
    whoisguardEnabled: result['@_WhoisguardEnable'],
    nonRealTimeDomain: result['@_NonRealTimeDomain'],
  };
}

function addContactParams(
  params: Record<string, string | number | boolean>,
  prefix: string,
  contact: ContactInfo,
): void {
  params[`${prefix}FirstName`] = contact.firstName;
  params[`${prefix}LastName`] = contact.lastName;
  params[`${prefix}Address1`] = contact.address1;
  if (contact.address2) params[`${prefix}Address2`] = contact.address2;
  params[`${prefix}City`] = contact.city;
  params[`${prefix}StateProvince`] = contact.stateProvince;
  params[`${prefix}PostalCode`] = contact.postalCode;
  params[`${prefix}Country`] = contact.country;
  params[`${prefix}Phone`] = contact.phone;
  if (contact.phoneExt) params[`${prefix}PhoneExt`] = contact.phoneExt;
  if (contact.fax) params[`${prefix}Fax`] = contact.fax;
  params[`${prefix}EmailAddress`] = contact.email;
  if (contact.organizationName) params[`${prefix}OrganizationName`] = contact.organizationName;
  if (contact.jobTitle) params[`${prefix}JobTitle`] = contact.jobTitle;
}

// Domain Renewal
export interface RenewalResult {
  domainName: string;
  domainId: number;
  charged: boolean;
  chargedAmount: number;
  orderId: number;
  transactionId: number;
  expireDate: string;
}

export async function renewDomain(
  client: NamecheapClient,
  domain: string,
  years = 1,
  promoCode?: string,
): Promise<RenewalResult> {
  const params: Record<string, string | number | boolean> = {
    DomainName: domain,
    Years: years,
  };

  if (promoCode) {
    params.PromotionCode = promoCode;
  }

  const response = await client.request('namecheap.domains.renew', params);
  const data = NamecheapClient.handleResponse(response) as {
    DomainRenewResult?: {
      '@_DomainName': string;
      '@_DomainID': number;
      '@_Renew': boolean;
      '@_OrderID': number;
      '@_TransactionID': number;
      '@_ChargedAmount': number;
      DomainDetails?: {
        ExpiredDate?: string;
      };
    };
  };

  const result = data.DomainRenewResult;
  if (!result) {
    throw new Error('No renewal result returned from API');
  }

  return {
    domainName: result['@_DomainName'],
    domainId: result['@_DomainID'],
    charged: result['@_Renew'],
    chargedAmount: Number(result['@_ChargedAmount']) || 0,
    orderId: result['@_OrderID'],
    transactionId: result['@_TransactionID'],
    expireDate: result.DomainDetails?.ExpiredDate || '',
  };
}

// Domain Reactivation
export async function reactivateDomain(
  client: NamecheapClient,
  domain: string,
  years = 1,
  promoCode?: string,
): Promise<RenewalResult> {
  const params: Record<string, string | number | boolean> = {
    DomainName: domain,
    Years: years,
  };

  if (promoCode) {
    params.PromotionCode = promoCode;
  }

  const response = await client.request('namecheap.domains.reactivate', params);
  const data = NamecheapClient.handleResponse(response) as {
    DomainReactivateResult?: {
      '@_Domain': string;
      '@_IsSuccess': boolean;
      '@_OrderID': number;
      '@_TransactionID': number;
      '@_ChargedAmount': number;
    };
  };

  const result = data.DomainReactivateResult;
  if (!result) {
    throw new Error('No reactivation result returned from API');
  }

  return {
    domainName: result['@_Domain'],
    domainId: 0,
    charged: result['@_IsSuccess'],
    chargedAmount: Number(result['@_ChargedAmount']) || 0,
    orderId: result['@_OrderID'],
    transactionId: result['@_TransactionID'],
    expireDate: '',
  };
}

// Domain Contacts
export interface DomainContacts {
  registrant: ContactInfo;
  tech: ContactInfo;
  admin: ContactInfo;
  auxBilling: ContactInfo;
}

export async function getContacts(
  client: NamecheapClient,
  domain: string,
): Promise<DomainContacts> {
  const response = await client.request('namecheap.domains.getContacts', {
    DomainName: domain,
  });

  const data = NamecheapClient.handleResponse(response) as {
    DomainContactsResult?: {
      Registrant?: RawContactInfo;
      Tech?: RawContactInfo;
      Admin?: RawContactInfo;
      AuxBilling?: RawContactInfo;
    };
  };

  const result = data.DomainContactsResult;
  if (!result) {
    throw new Error('No contacts result returned from API');
  }

  return {
    registrant: parseContactInfo(result.Registrant),
    tech: parseContactInfo(result.Tech),
    admin: parseContactInfo(result.Admin),
    auxBilling: parseContactInfo(result.AuxBilling),
  };
}

interface RawContactInfo {
  FirstName?: string;
  LastName?: string;
  Address1?: string;
  Address2?: string;
  City?: string;
  StateProvince?: string;
  PostalCode?: string;
  Country?: string;
  Phone?: string;
  PhoneExt?: string;
  Fax?: string;
  EmailAddress?: string;
  OrganizationName?: string;
  JobTitle?: string;
}

function parseContactInfo(raw?: RawContactInfo): ContactInfo {
  return {
    firstName: raw?.FirstName || '',
    lastName: raw?.LastName || '',
    address1: raw?.Address1 || '',
    address2: raw?.Address2,
    city: raw?.City || '',
    stateProvince: raw?.StateProvince || '',
    postalCode: raw?.PostalCode || '',
    country: raw?.Country || '',
    phone: raw?.Phone || '',
    phoneExt: raw?.PhoneExt,
    fax: raw?.Fax,
    email: raw?.EmailAddress || '',
    organizationName: raw?.OrganizationName,
    jobTitle: raw?.JobTitle,
  };
}

export async function setContacts(
  client: NamecheapClient,
  domain: string,
  contacts: Partial<DomainContacts>,
): Promise<boolean> {
  // First get existing contacts to fill in any missing ones
  const existing = await getContacts(client, domain);

  const params: Record<string, string | number | boolean> = {
    DomainName: domain,
  };

  // Use provided contacts or fall back to existing
  const registrant = contacts.registrant || existing.registrant;
  const tech = contacts.tech || existing.tech;
  const admin = contacts.admin || existing.admin;
  const auxBilling = contacts.auxBilling || existing.auxBilling;

  addContactParams(params, 'Registrant', registrant);
  addContactParams(params, 'Tech', tech);
  addContactParams(params, 'Admin', admin);
  addContactParams(params, 'AuxBilling', auxBilling);

  const response = await client.request('namecheap.domains.setContacts', params);
  NamecheapClient.handleResponse(response);

  return true;
}
