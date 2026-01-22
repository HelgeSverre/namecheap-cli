// Namecheap API Types

export interface ApiCredentials {
  apiUser: string;
  apiKey: string;
  userName: string;
  clientIp: string;
}

export interface ApiConfig {
  sandbox: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  errors: ApiError[];
  warnings: string[];
  data?: T;
  requestId?: string;
}

export interface ApiError {
  code: string;
  message: string;
}

// Domain Types
export interface Domain {
  id: number;
  name: string;
  user: string;
  created: string;
  expires: string;
  isExpired: boolean;
  isLocked: boolean;
  autoRenew: boolean;
  whoisGuard: string;
  isPremium: boolean;
  isOurDns: boolean;
}

export interface DomainInfo {
  domainName: string;
  ownerName: string;
  status: string;
  isOwner: boolean;
  isPremium: boolean;
  dnsProviderType: string;
  whoisGuard: DomainWhoisGuard;
  createdDate: string;
  expiredDate: string;
  modifyDate: string;
}

export interface DomainWhoisGuard {
  enabled: boolean;
  id: string;
  expiredDate: string;
}

export interface DomainAvailability {
  domain: string;
  available: boolean;
  premium: boolean;
  premiumPrice?: number;
  regularPrice?: number;
  currency?: string;
}

// DNS Types
export type DnsRecordType =
  | 'A'
  | 'AAAA'
  | 'CNAME'
  | 'MX'
  | 'TXT'
  | 'NS'
  | 'SRV'
  | 'CAA'
  | 'ALIAS'
  | 'URL'
  | 'URL301'
  | 'FRAME';

export interface DnsRecord {
  hostId: string;
  name: string;
  type: DnsRecordType;
  address: string;
  mxPref?: number;
  ttl: number;
  isActive: boolean;
  isDDNSEnabled?: boolean;
}

export interface DnsRecordInput {
  name: string;
  type: DnsRecordType;
  address: string;
  mxPref?: number;
  ttl?: number;
}

// Nameserver Types
export interface Nameserver {
  nameserver: string;
  ip?: string;
}

export interface NameserverInfo {
  domain: string;
  nameservers: string[];
  isUsingOurDns: boolean;
}

// Contact Types
export interface Contact {
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

export interface DomainContacts {
  registrant: Contact;
  tech: Contact;
  admin: Contact;
  auxBilling: Contact;
}

// User/Account Types
export interface AccountBalance {
  currency: string;
  availableBalance: number;
  accountBalance: number;
  earnedAmount: number;
  withdrawableAmount: number;
  pendingAmount: number;
}

// Domain Registration Options
export interface DomainRegistrationOptions {
  years?: number;
  nameservers?: string[];
  addFreeWhoisguard?: boolean;
  enableWhoisguard?: boolean;
  autoRenew?: boolean;
  contacts?: DomainContacts;
}

// Domain Renewal Result
export interface DomainRenewalResult {
  domainName: string;
  domainId: number;
  charged: boolean;
  chargedAmount: number;
  orderId: number;
  transactionId: number;
  expireDate: string;
}

// Domain Registration Result
export interface DomainRegistrationResult {
  domain: string;
  registered: boolean;
  chargedAmount: number;
  domainId: number;
  orderId: number;
  transactionId: number;
  whoisguardEnable: boolean;
  nonRealTimeDomain: boolean;
}

// Email Forwarding
export interface EmailForward {
  mailbox: string;
  forwardTo: string;
}

// API Method Commands
export type ApiCommand =
  // Domains
  | 'namecheap.domains.getList'
  | 'namecheap.domains.getInfo'
  | 'namecheap.domains.create'
  | 'namecheap.domains.check'
  | 'namecheap.domains.renew'
  | 'namecheap.domains.reactivate'
  | 'namecheap.domains.getRegistrarLock'
  | 'namecheap.domains.setRegistrarLock'
  | 'namecheap.domains.getContacts'
  | 'namecheap.domains.setContacts'
  // DNS
  | 'namecheap.domains.dns.getList'
  | 'namecheap.domains.dns.getHosts'
  | 'namecheap.domains.dns.setHosts'
  | 'namecheap.domains.dns.setDefault'
  | 'namecheap.domains.dns.setCustom'
  | 'namecheap.domains.dns.getEmailForwarding'
  | 'namecheap.domains.dns.setEmailForwarding'
  // Nameservers
  | 'namecheap.domains.ns.create'
  | 'namecheap.domains.ns.delete'
  | 'namecheap.domains.ns.getInfo'
  | 'namecheap.domains.ns.update'
  // Users
  | 'namecheap.users.getBalances'
  | 'namecheap.users.getPricing'
  | 'namecheap.users.changePassword'
  | 'namecheap.users.update'
  | 'namecheap.users.createaddfundsrequest'
  | 'namecheap.users.getAddFundsStatus'
  | 'namecheap.users.create'
  | 'namecheap.users.login'
  | 'namecheap.users.resetPassword'
  // WhoisGuard
  | 'namecheap.whoisguard.getList'
  | 'namecheap.whoisguard.enable'
  | 'namecheap.whoisguard.disable'
  | 'namecheap.whoisguard.allot'
  | 'namecheap.whoisguard.unallot'
  | 'namecheap.whoisguard.renew'
  // Users Address
  | 'namecheap.users.address.create'
  | 'namecheap.users.address.delete'
  | 'namecheap.users.address.getInfo'
  | 'namecheap.users.address.getList'
  | 'namecheap.users.address.setDefault'
  | 'namecheap.users.address.update';

// Pagination
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  items: T[];
}
