import { NamecheapClient } from './client.js';
import { parseUserBalances, parseUserPricing } from './parser.js';

export interface UserBalances {
  currency: string;
  availableBalance: number;
  accountBalance: number;
  earnedAmount: number;
  withdrawableAmount: number;
  pendingAmount: number;
}

export interface PricingInfo {
  productType: string;
  productCategory: string;
  productName: string;
  price: number;
  additionalCost: number;
  regularPrice: number;
  yourPrice: number;
  yourPriceType: string;
  currency: string;
  duration: number;
}

export async function getBalances(client: NamecheapClient): Promise<UserBalances> {
  const response = await client.request('namecheap.users.getBalances');
  const rawData = NamecheapClient.handleResponse(response);

  const data = parseUserBalances(rawData) as {
    '@_Currency'?: string;
    '@_AvailableBalance'?: number;
    '@_AccountBalance'?: number;
    '@_EarnedAmount'?: number;
    '@_WithdrawableAmount'?: number;
    '@_PendingAmount'?: number;
  };

  return {
    currency: data['@_Currency'] || 'USD',
    availableBalance: Number(data['@_AvailableBalance']) || 0,
    accountBalance: Number(data['@_AccountBalance']) || 0,
    earnedAmount: Number(data['@_EarnedAmount']) || 0,
    withdrawableAmount: Number(data['@_WithdrawableAmount']) || 0,
    pendingAmount: Number(data['@_PendingAmount']) || 0,
  };
}

export interface PricingOptions {
  action: 'register' | 'renew' | 'transfer' | 'restore';
  tld?: string;
  years?: number;
}

export async function getPricing(
  client: NamecheapClient,
  options: PricingOptions,
): Promise<PricingInfo[]> {
  const params: Record<string, string | number> = {
    ProductType: 'DOMAIN',
    ActionName: options.action.toUpperCase(),
  };

  if (options.tld) {
    params.ProductName = options.tld.replace(/^\./, ''); // Remove leading dot if present
  }

  const response = await client.request('namecheap.users.getPricing', params);
  const rawData = NamecheapClient.handleResponse(response);

  const data = parseUserPricing(rawData);
  return parsePricingResult(data, options.years || 1);
}

export type ChangePasswordOptions =
  | { oldPassword: string; newPassword: string }
  | { resetCode: string; newPassword: string };

export interface ChangePasswordResult {
  success: boolean;
  userId: string;
}

export async function changePassword(
  client: NamecheapClient,
  options: ChangePasswordOptions,
): Promise<ChangePasswordResult> {
  const params: Record<string, string> = {
    NewPassword: options.newPassword,
  };

  if ('oldPassword' in options) {
    params.OldPassword = options.oldPassword;
  } else {
    params.ResetCode = options.resetCode;
  }

  const response = await client.request('namecheap.users.changePassword', params);
  const data = NamecheapClient.handleResponse(response) as {
    UserChangePasswordResult?: {
      '@_Success': boolean;
      '@_UserId': string;
    };
  };

  const result = data.UserChangePasswordResult;
  return {
    success: result?.['@_Success'] ?? false,
    userId: String(result?.['@_UserId'] ?? ''),
  };
}

export interface UserUpdateInput {
  firstName: string;
  lastName: string;
  jobTitle?: string;
  organization?: string;
  address1: string;
  address2?: string;
  city: string;
  stateProvince: string;
  zip: string;
  country: string;
  email: string;
  phone: string;
  phoneExt?: string;
  fax?: string;
}

export interface UserUpdateResult {
  success: boolean;
  userId: string;
}

export async function updateUser(
  client: NamecheapClient,
  input: UserUpdateInput,
): Promise<UserUpdateResult> {
  const params: Record<string, string> = {
    FirstName: input.firstName,
    LastName: input.lastName,
    Address1: input.address1,
    City: input.city,
    StateProvince: input.stateProvince,
    Zip: input.zip,
    Country: input.country,
    EmailAddress: input.email,
    Phone: input.phone,
  };

  if (input.jobTitle) params.JobTitle = input.jobTitle;
  if (input.organization) params.Organization = input.organization;
  if (input.address2) params.Address2 = input.address2;
  if (input.phoneExt) params.PhoneExt = input.phoneExt;
  if (input.fax) params.Fax = input.fax;

  const response = await client.request('namecheap.users.update', params);
  const data = NamecheapClient.handleResponse(response) as {
    UserUpdateResult?: {
      '@_Success': boolean;
      '@_UserId': string;
    };
  };

  const result = data.UserUpdateResult;
  return {
    success: result?.['@_Success'] ?? false,
    userId: String(result?.['@_UserId'] ?? ''),
  };
}

export interface CreateAddFundsOptions {
  username: string;
  amount: number;
  returnUrl: string;
}

export interface CreateAddFundsResult {
  tokenId: string;
  redirectUrl: string;
  returnUrl: string;
}

export async function createAddFundsRequest(
  client: NamecheapClient,
  options: CreateAddFundsOptions,
): Promise<CreateAddFundsResult> {
  const params: Record<string, string | number> = {
    Username: options.username,
    PaymentType: 'Creditcard',
    Amount: options.amount,
    ReturnUrl: options.returnUrl,
  };

  const response = await client.request('namecheap.users.createaddfundsrequest', params);
  const data = NamecheapClient.handleResponse(response) as {
    Createaddfundsrequestresult?: {
      '@_TokenId': string;
      '@_RedirectURL': string;
      '@_ReturnURL': string;
    };
  };

  const result = data.Createaddfundsrequestresult;
  return {
    tokenId: result?.['@_TokenId'] ?? '',
    redirectUrl: result?.['@_RedirectURL'] ?? '',
    returnUrl: result?.['@_ReturnURL'] ?? '',
  };
}

export type AddFundsStatus = 'CREATED' | 'SUBMITTED' | 'COMPLETED' | 'FAILED' | 'EXPIRED';

export interface GetAddFundsStatusResult {
  transactionId: string;
  amount: number;
  status: AddFundsStatus;
}

export async function getAddFundsStatus(
  client: NamecheapClient,
  tokenId: string,
): Promise<GetAddFundsStatusResult> {
  const response = await client.request('namecheap.users.getAddFundsStatus', {
    TokenId: tokenId,
  });
  const data = NamecheapClient.handleResponse(response) as {
    GetAddFundsStatusResult?: {
      '@_TransactionId': string;
      '@_Amount': number;
      '@_Status': AddFundsStatus;
    };
  };

  const result = data.GetAddFundsStatusResult;
  return {
    transactionId: String(result?.['@_TransactionId'] ?? ''),
    amount: Number(result?.['@_Amount']) || 0,
    status: result?.['@_Status'] ?? 'CREATED',
  };
}

export interface CreateUserInput {
  username: string;
  password: string;
  email: string;
  ignoreDuplicateEmail?: boolean;
  acceptTerms: boolean;
  acceptNews?: boolean;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  organization?: string;
  address1: string;
  address2?: string;
  city: string;
  stateProvince: string;
  zip: string;
  country: string;
  phone: string;
  phoneExt?: string;
  fax?: string;
}

export interface CreateUserResult {
  success: boolean;
  userId: string;
}

export async function createUser(
  client: NamecheapClient,
  input: CreateUserInput,
): Promise<CreateUserResult> {
  const params: Record<string, string | number | boolean> = {
    NewUserName: input.username,
    NewUserPassword: input.password,
    EmailAddress: input.email,
    AcceptTerms: input.acceptTerms ? 1 : 0,
    FirstName: input.firstName,
    LastName: input.lastName,
    Address1: input.address1,
    City: input.city,
    StateProvince: input.stateProvince,
    Zip: input.zip,
    Country: input.country,
    Phone: input.phone,
  };

  if (input.ignoreDuplicateEmail !== undefined) {
    params.IgnoreDuplicateEmailAddress = input.ignoreDuplicateEmail ? 'yes' : 'no';
  }
  if (input.acceptNews !== undefined) params.AcceptNews = input.acceptNews ? 1 : 0;
  if (input.jobTitle) params.JobTitle = input.jobTitle;
  if (input.organization) params.Organization = input.organization;
  if (input.address2) params.Address2 = input.address2;
  if (input.phoneExt) params.PhoneExt = input.phoneExt;
  if (input.fax) params.Fax = input.fax;

  const response = await client.request('namecheap.users.create', params);
  const data = NamecheapClient.handleResponse(response) as {
    UserCreateResult?: {
      '@_Success': boolean;
      '@_UserId': string;
    };
  };

  const result = data.UserCreateResult;
  return {
    success: result?.['@_Success'] ?? false,
    userId: String(result?.['@_UserId'] ?? ''),
  };
}

export interface LoginResult {
  username: string;
  loginSuccess: boolean;
}

export async function loginUser(
  client: NamecheapClient,
  username: string,
  password: string,
): Promise<LoginResult> {
  const response = await client.request('namecheap.users.login', {
    UserName: username,
    Password: password,
  });
  const data = NamecheapClient.handleResponse(response) as {
    UserLoginResult?: {
      '@_UserName': string;
      '@_LoginSuccess': boolean;
    };
  };

  const result = data.UserLoginResult;
  return {
    username: result?.['@_UserName'] ?? '',
    loginSuccess: result?.['@_LoginSuccess'] ?? false,
  };
}

export interface ResetPasswordOptions {
  findBy: 'EMAILADDRESS' | 'DOMAINNAME' | 'USERNAME';
  findByValue: string;
  emailFromName?: string;
  emailFrom?: string;
  urlPattern?: string;
}

export interface ResetPasswordResult {
  success: boolean;
}

export async function resetPassword(
  client: NamecheapClient,
  options: ResetPasswordOptions,
): Promise<ResetPasswordResult> {
  const params: Record<string, string> = {
    FindBy: options.findBy,
    FindByValue: options.findByValue,
  };

  if (options.emailFromName) params.EmailFromName = options.emailFromName;
  if (options.emailFrom) params.EmailFrom = options.emailFrom;
  if (options.urlPattern) params.URLPattern = options.urlPattern;

  const response = await client.request('namecheap.users.resetPassword', params);
  const data = NamecheapClient.handleResponse(response) as {
    UserResetPasswordResult?: {
      '@_Success': boolean;
    };
  };

  const result = data.UserResetPasswordResult;
  return {
    success: result?.['@_Success'] ?? false,
  };
}

function parsePricingResult(data: unknown, years: number): PricingInfo[] {
  const results: PricingInfo[] = [];

  // The pricing response is nested and complex
  // UserGetPricingResult > ProductType > ProductCategory > Product > Price
  const typedData = data as {
    ProductType?:
      | {
          ProductCategory?: unknown | unknown[];
          '@_Name'?: string;
        }
      | {
          ProductCategory?: unknown | unknown[];
          '@_Name'?: string;
        }[];
  };

  if (!typedData?.ProductType) {
    return results;
  }

  const productTypes = Array.isArray(typedData.ProductType)
    ? typedData.ProductType
    : [typedData.ProductType];

  for (const productType of productTypes) {
    const categories = productType.ProductCategory;
    if (!categories) continue;

    const categoryList = Array.isArray(categories) ? categories : [categories];

    for (const category of categoryList) {
      const typedCategory = category as {
        Product?: unknown | unknown[];
        '@_Name'?: string;
      };

      const products = typedCategory.Product;
      if (!products) continue;

      const productList = Array.isArray(products) ? products : [products];

      for (const product of productList) {
        const typedProduct = product as {
          Price?: unknown | unknown[];
          '@_Name'?: string;
        };

        const prices = typedProduct.Price;
        if (!prices) continue;

        const priceList = Array.isArray(prices) ? prices : [prices];

        for (const price of priceList) {
          const typedPrice = price as {
            '@_Duration'?: number;
            '@_Price'?: number;
            '@_AdditionalCost'?: number;
            '@_RegularPrice'?: number;
            '@_YourPrice'?: number;
            '@_YourPriceType'?: string;
            '@_Currency'?: string;
          };

          const duration = Number(typedPrice['@_Duration']) || 1;

          // Filter by years if specified
          if (duration !== years) continue;

          results.push({
            productType: productType['@_Name'] || 'DOMAIN',
            productCategory: typedCategory['@_Name'] || '',
            productName: typedProduct['@_Name'] || '',
            price: Number(typedPrice['@_Price']) || 0,
            additionalCost: Number(typedPrice['@_AdditionalCost']) || 0,
            regularPrice: Number(typedPrice['@_RegularPrice']) || 0,
            yourPrice: Number(typedPrice['@_YourPrice']) || 0,
            yourPriceType: typedPrice['@_YourPriceType'] || '',
            currency: typedPrice['@_Currency'] || 'USD',
            duration,
          });
        }
      }
    }
  }

  return results;
}
