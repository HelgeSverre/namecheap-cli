import type { NamecheapClient } from './client.js';
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

  if (!response.success) {
    const errorMessages = response.errors.map((e) => `[${e.code}] ${e.message}`).join('\n');
    throw new Error(`API Error:\n${errorMessages}`);
  }

  const data = parseUserBalances(response.data) as {
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

  if (!response.success) {
    const errorMessages = response.errors.map((e) => `[${e.code}] ${e.message}`).join('\n');
    throw new Error(`API Error:\n${errorMessages}`);
  }

  const data = parseUserPricing(response.data);
  return parsePricingResult(data, options.years || 1);
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
