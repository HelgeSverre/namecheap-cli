import { NamecheapClient } from './client.js';

export interface WhoisGuardItem {
  id: string;
  domainName: string;
  enabled: boolean;
  expireDate: string;
  status: string;
  emailHash: string;
}

interface RawWhoisGuardItem {
  '@_ID': string;
  '@_DomainName': string;
  '@_Enabled': boolean;
  '@_ExpDate': string;
  '@_Status': string;
  '@_EmailHash'?: string;
}

export interface WhoisGuardListResult {
  items: WhoisGuardItem[];
  totalItems: number;
  currentPage: number;
  pageSize: number;
}

export async function getWhoisGuardList(
  client: NamecheapClient,
  options: { page?: number; pageSize?: number } = {},
): Promise<WhoisGuardListResult> {
  const params: Record<string, string | number | boolean> = {};

  if (options.page) params.Page = options.page;
  if (options.pageSize) params.PageSize = options.pageSize;

  const response = await client.request('namecheap.whoisguard.getList', params);
  const data = NamecheapClient.handleResponse(response) as {
    WhoisguardGetListResult?: {
      '@_Type'?: string;
      Whoisguard?: RawWhoisGuardItem | RawWhoisGuardItem[];
      Paging?: {
        TotalItems?: number;
        CurrentPage?: number;
        PageSize?: number;
      };
    };
  };

  const result = data.WhoisguardGetListResult;
  if (!result) {
    return { items: [], totalItems: 0, currentPage: 1, pageSize: 20 };
  }

  const rawItems = result.Whoisguard;
  let items: WhoisGuardItem[] = [];

  if (rawItems) {
    const itemList = Array.isArray(rawItems) ? rawItems : [rawItems];
    items = itemList.map((item) => ({
      id: String(item['@_ID']),
      domainName: item['@_DomainName'] || '',
      enabled: item['@_Enabled'],
      expireDate: item['@_ExpDate'],
      status: item['@_Status'],
      emailHash: item['@_EmailHash'] || '',
    }));
  }

  return {
    items,
    totalItems: result.Paging?.TotalItems || items.length,
    currentPage: result.Paging?.CurrentPage || 1,
    pageSize: result.Paging?.PageSize || 20,
  };
}

export async function enableWhoisGuard(
  client: NamecheapClient,
  whoisguardId: string,
  forwardedToEmail: string,
): Promise<boolean> {
  const response = await client.request('namecheap.whoisguard.enable', {
    WhoisguardID: whoisguardId,
    ForwardedToEmail: forwardedToEmail,
  });

  NamecheapClient.handleResponse(response);
  return true;
}

export async function disableWhoisGuard(
  client: NamecheapClient,
  whoisguardId: string,
): Promise<boolean> {
  const response = await client.request('namecheap.whoisguard.disable', {
    WhoisguardID: whoisguardId,
  });

  NamecheapClient.handleResponse(response);
  return true;
}

export async function allotWhoisGuard(
  client: NamecheapClient,
  whoisguardId: string,
  domainName: string,
): Promise<boolean> {
  const response = await client.request('namecheap.whoisguard.allot', {
    WhoisguardId: whoisguardId,
    DomainName: domainName,
  });

  NamecheapClient.handleResponse(response);
  return true;
}

export async function unallotWhoisGuard(
  client: NamecheapClient,
  whoisguardId: string,
): Promise<boolean> {
  const response = await client.request('namecheap.whoisguard.unallot', {
    WhoisguardId: whoisguardId,
  });

  NamecheapClient.handleResponse(response);
  return true;
}

export interface WhoisGuardRenewalResult {
  whoisguardId: string;
  years: number;
  renewed: boolean;
  chargedAmount: number;
  orderId: number;
  transactionId: number;
}

export async function renewWhoisGuard(
  client: NamecheapClient,
  whoisguardId: string,
  years = 1,
  promoCode?: string,
): Promise<WhoisGuardRenewalResult> {
  const params: Record<string, string | number | boolean> = {
    WhoisguardId: whoisguardId,
    Years: years,
  };

  if (promoCode) {
    params.PromotionCode = promoCode;
  }

  const response = await client.request('namecheap.whoisguard.renew', params);
  const data = NamecheapClient.handleResponse(response) as {
    WhoisguardRenewResult?: {
      '@_WhoisguardId': string;
      '@_Years': number;
      '@_Renew': boolean;
      '@_OrderId': number;
      '@_TransactionId': number;
      '@_ChargedAmount': number;
    };
  };

  const result = data.WhoisguardRenewResult;
  if (!result) {
    throw new Error('No renewal result returned from API');
  }

  return {
    whoisguardId: result['@_WhoisguardId'],
    years: result['@_Years'],
    renewed: result['@_Renew'],
    chargedAmount: Number(result['@_ChargedAmount']) || 0,
    orderId: result['@_OrderId'],
    transactionId: result['@_TransactionId'],
  };
}

// Helper function to find WhoisGuard by domain
export async function findWhoisGuardByDomain(
  client: NamecheapClient,
  domain: string,
): Promise<WhoisGuardItem | null> {
  const result = await getWhoisGuardList(client, { pageSize: 100 });

  return (
    result.items.find((item) => item.domainName.toLowerCase() === domain.toLowerCase()) || null
  );
}
