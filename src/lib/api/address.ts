import { NamecheapClient } from './client.js';

export interface AddressItem {
  id: string;
  name: string;
}

export interface AddressListResult {
  items: AddressItem[];
}

export interface AddressInfo {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle?: string;
  organization?: string;
  address1: string;
  address2?: string;
  city: string;
  stateProvince: string;
  stateProvinceChoice: string;
  zip: string;
  country: string;
  phone: string;
  phoneExt?: string;
  fax?: string;
  default: boolean;
}

export interface AddressInput {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle?: string;
  organization?: string;
  address1: string;
  address2?: string;
  city: string;
  stateProvince: string;
  stateProvinceChoice: string;
  zip: string;
  country: string;
  phone: string;
  phoneExt?: string;
  fax?: string;
  default?: boolean;
}

interface RawAddressItem {
  '@_AddressId': string;
  '@_AddressName': string;
}

export async function getAddressList(client: NamecheapClient): Promise<AddressListResult> {
  const response = await client.request('namecheap.users.address.getList');
  const data = NamecheapClient.handleResponse(response) as {
    AddressGetListResult?: {
      List?: RawAddressItem | RawAddressItem[];
    };
  };

  const result = data.AddressGetListResult;
  if (!result?.List) {
    return { items: [] };
  }

  const rawItems = result.List;
  const itemList = Array.isArray(rawItems) ? rawItems : [rawItems];

  const items: AddressItem[] = itemList.map((item) => ({
    id: String(item['@_AddressId']),
    name: item['@_AddressName'] || '',
  }));

  return { items };
}

export async function getAddressInfo(
  client: NamecheapClient,
  addressId: string,
): Promise<AddressInfo> {
  const response = await client.request('namecheap.users.address.getInfo', {
    AddressId: addressId,
  });

  const data = NamecheapClient.handleResponse(response) as {
    GetAddressInfoResult?: {
      '@_AddressId': string;
      '@_AddressName': string;
      '@_Default_YN': boolean;
      FirstName?: string;
      LastName?: string;
      EmailAddress?: string;
      JobTitle?: string;
      Organization?: string;
      Address1?: string;
      Address2?: string;
      City?: string;
      StateProvince?: string;
      StateProvinceChoice?: string;
      Zip?: string;
      Country?: string;
      Phone?: string;
      PhoneExt?: string;
      Fax?: string;
    };
  };

  const result = data.GetAddressInfoResult;
  if (!result) {
    throw new Error('No address info returned from API');
  }

  return {
    id: String(result['@_AddressId']),
    name: result['@_AddressName'] || '',
    firstName: result.FirstName || '',
    lastName: result.LastName || '',
    email: result.EmailAddress || '',
    jobTitle: result.JobTitle || undefined,
    organization: result.Organization || undefined,
    address1: result.Address1 || '',
    address2: result.Address2 || undefined,
    city: result.City || '',
    stateProvince: result.StateProvince || '',
    stateProvinceChoice: result.StateProvinceChoice || '',
    zip: result.Zip || '',
    country: result.Country || '',
    phone: result.Phone || '',
    phoneExt: result.PhoneExt || undefined,
    fax: result.Fax || undefined,
    default: result['@_Default_YN'] === true,
  };
}

function buildAddressParams(input: AddressInput): Record<string, string | number | boolean> {
  const params: Record<string, string | number | boolean> = {
    AddressName: input.name,
    FirstName: input.firstName,
    LastName: input.lastName,
    EmailAddress: input.email,
    Address1: input.address1,
    City: input.city,
    StateProvince: input.stateProvince,
    StateProvinceChoice: input.stateProvinceChoice,
    Zip: input.zip,
    Country: input.country,
    Phone: input.phone,
  };

  if (input.jobTitle) params.JobTitle = input.jobTitle;
  if (input.organization) params.Organization = input.organization;
  if (input.address2) params.Address2 = input.address2;
  if (input.phoneExt) params.PhoneExt = input.phoneExt;
  if (input.fax) params.Fax = input.fax;
  if (input.default !== undefined) params.DefaultYN = input.default ? 1 : 0;

  return params;
}

export async function createAddress(
  client: NamecheapClient,
  input: AddressInput,
): Promise<{ success: boolean; addressId: string; addressName: string }> {
  const params = buildAddressParams(input);

  const response = await client.request('namecheap.users.address.create', params);
  const data = NamecheapClient.handleResponse(response) as {
    AddressCreateResult?: {
      '@_AddressId': string;
      '@_AddressName': string;
      '@_Success': boolean;
    };
  };

  const result = data.AddressCreateResult;
  if (!result) {
    throw new Error('No result returned from API');
  }

  return {
    success: result['@_Success'] === true,
    addressId: String(result['@_AddressId']),
    addressName: result['@_AddressName'] || '',
  };
}

export async function updateAddress(
  client: NamecheapClient,
  addressId: string,
  input: AddressInput,
): Promise<{ success: boolean; addressId: string; addressName: string }> {
  const params = buildAddressParams(input);
  params.AddressId = addressId;

  const response = await client.request('namecheap.users.address.update', params);
  const data = NamecheapClient.handleResponse(response) as {
    AddressUpdateResult?: {
      '@_AddressId': string;
      '@_AddressName': string;
      '@_Success': boolean;
    };
  };

  const result = data.AddressUpdateResult;
  if (!result) {
    throw new Error('No result returned from API');
  }

  return {
    success: result['@_Success'] === true,
    addressId: String(result['@_AddressId']),
    addressName: result['@_AddressName'] || '',
  };
}

export async function deleteAddress(
  client: NamecheapClient,
  addressId: string,
): Promise<{ success: boolean; profileId: string; username: string }> {
  const response = await client.request('namecheap.users.address.delete', {
    AddressId: addressId,
  });

  const data = NamecheapClient.handleResponse(response) as {
    AddressDeleteResult?: {
      '@_ProfileId': string;
      '@_UserName': string;
      '@_Success': boolean;
    };
  };

  const result = data.AddressDeleteResult;
  if (!result) {
    throw new Error('No result returned from API');
  }

  return {
    success: result['@_Success'] === true,
    profileId: String(result['@_ProfileId']),
    username: result['@_UserName'] || '',
  };
}

export async function setDefaultAddress(
  client: NamecheapClient,
  addressId: string,
): Promise<{ success: boolean; addressId: string }> {
  const response = await client.request('namecheap.users.address.setDefault', {
    AddressId: addressId,
  });

  const data = NamecheapClient.handleResponse(response) as {
    AddressSetDefaultResult?: {
      '@_AddressId': string;
      '@_Success': boolean;
    };
  };

  const result = data.AddressSetDefaultResult;
  if (!result) {
    throw new Error('No result returned from API');
  }

  return {
    success: result['@_Success'] === true,
    addressId: String(result['@_AddressId']),
  };
}
