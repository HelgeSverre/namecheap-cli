import { XMLParser } from 'fast-xml-parser';
import type { ApiError, ApiResponse } from './types.js';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseAttributeValue: true,
  trimValues: true,
});

interface RawApiResponse {
  ApiResponse: {
    '@_Status': 'OK' | 'ERROR';
    Errors?: {
      Error?: RawError | RawError[];
    };
    Warnings?: {
      Warning?: string | string[];
    };
    RequestedCommand?: string;
    CommandResponse?: unknown;
    Server?: string;
    GMTTimeDifference?: string;
    ExecutionTime?: number;
  };
}

interface RawError {
  '@_Number': string;
  '#text': string;
}

export function parseApiResponse<T>(xml: string): ApiResponse<T> {
  const parsed = parser.parse(xml) as RawApiResponse;
  const response = parsed.ApiResponse;

  const success = response['@_Status'] === 'OK';
  const errors = parseErrors(response.Errors);
  const warnings = parseWarnings(response.Warnings);

  return {
    success,
    errors,
    warnings,
    data: success ? (response.CommandResponse as T) : undefined,
  };
}

function parseErrors(errors?: { Error?: RawError | RawError[] }): ApiError[] {
  if (!errors?.Error) return [];

  const errorList = Array.isArray(errors.Error) ? errors.Error : [errors.Error];
  return errorList.map((err) => ({
    code: String(err['@_Number']),
    message: err['#text'],
  }));
}

function parseWarnings(warnings?: { Warning?: string | string[] }): string[] {
  if (!warnings?.Warning) return [];
  return Array.isArray(warnings.Warning) ? warnings.Warning : [warnings.Warning];
}

// Domain-specific parsers
export function parseDomainList(data: unknown): unknown[] {
  const commandResponse = data as {
    DomainGetListResult?: {
      Domain?: unknown | unknown[];
    };
  };

  const domains = commandResponse?.DomainGetListResult?.Domain;
  if (!domains) return [];
  return Array.isArray(domains) ? domains : [domains];
}

export function parseDomainInfo(data: unknown): unknown {
  const commandResponse = data as {
    DomainGetInfoResult?: unknown;
  };
  return commandResponse?.DomainGetInfoResult;
}

export function parseDomainCheck(data: unknown): unknown[] {
  const commandResponse = data as {
    DomainCheckResult?: unknown | unknown[];
  };

  const results = commandResponse?.DomainCheckResult;
  if (!results) return [];
  return Array.isArray(results) ? results : [results];
}

export function parseDnsHosts(data: unknown): unknown[] {
  const commandResponse = data as {
    DomainDNSGetHostsResult?: {
      host?: unknown | unknown[];
    };
  };

  const hosts = commandResponse?.DomainDNSGetHostsResult?.host;
  if (!hosts) return [];
  return Array.isArray(hosts) ? hosts : [hosts];
}

export function parseNameservers(data: unknown): unknown {
  const commandResponse = data as {
    DomainDNSGetListResult?: unknown;
  };
  return commandResponse?.DomainDNSGetListResult;
}

export function parseUserBalances(data: unknown): unknown {
  const commandResponse = data as {
    UserGetBalancesResult?: unknown;
  };
  return commandResponse?.UserGetBalancesResult;
}

export function parseUserPricing(data: unknown): unknown {
  const commandResponse = data as {
    UserGetPricingResult?: unknown;
  };
  return commandResponse?.UserGetPricingResult;
}
