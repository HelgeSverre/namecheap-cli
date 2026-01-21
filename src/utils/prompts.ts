import { confirm, input, password, select } from '@inquirer/prompts';

export async function promptText(message: string, defaultValue?: string): Promise<string> {
  return input({
    message,
    default: defaultValue,
  });
}

export async function promptPassword(message: string): Promise<string> {
  return password({
    message,
    mask: '*',
  });
}

export async function promptConfirm(message: string, defaultValue = false): Promise<boolean> {
  return confirm({
    message,
    default: defaultValue,
  });
}

export async function promptSelect<T extends string>(
  message: string,
  choices: { value: T; name: string; description?: string }[],
): Promise<T> {
  return select({
    message,
    choices,
  });
}

// Auth-specific prompts
export interface AuthCredentials {
  apiUser: string;
  apiKey: string;
  userName: string;
  clientIp: string;
}

export async function promptAuthCredentials(): Promise<AuthCredentials> {
  console.log('\nEnter your Namecheap API credentials:');
  console.log('(Get your API key from: https://ap.www.namecheap.com/settings/tools/apiaccess/)\n');

  const apiUser = await promptText('API User (your Namecheap username):');
  const apiKey = await promptPassword('API Key:');
  const userName = await promptText('Username (usually same as API User):', apiUser);
  const clientIp = await promptText('Your whitelisted IP address:');

  return { apiUser, apiKey, userName, clientIp };
}

// DNS-specific prompts
export async function promptDnsRecordType(): Promise<string> {
  return select({
    message: 'Record type:',
    choices: [
      { value: 'A', name: 'A - IPv4 address' },
      { value: 'AAAA', name: 'AAAA - IPv6 address' },
      { value: 'CNAME', name: 'CNAME - Canonical name' },
      { value: 'MX', name: 'MX - Mail exchange' },
      { value: 'TXT', name: 'TXT - Text record' },
      { value: 'NS', name: 'NS - Nameserver' },
      { value: 'SRV', name: 'SRV - Service record' },
      { value: 'CAA', name: 'CAA - Certificate authority' },
    ],
  });
}

export async function promptDnsRecord(): Promise<{
  name: string;
  type: string;
  address: string;
  ttl: number;
  mxPref?: number;
}> {
  const type = await promptDnsRecordType();
  const name = await promptText('Host name (@ for root, or subdomain):');
  const address = await promptText('Value/Address:');
  const ttlStr = await promptText('TTL in seconds:', '1800');
  const ttl = parseInt(ttlStr, 10) || 1800;

  let mxPref: number | undefined;
  if (type === 'MX') {
    const mxPrefStr = await promptText('MX Priority:', '10');
    mxPref = parseInt(mxPrefStr, 10) || 10;
  }

  return { name, type, address, ttl, mxPref };
}

// Confirmation for dangerous operations
export async function confirmDangerousOperation(
  operation: string,
  target: string,
): Promise<boolean> {
  return confirm({
    message: `Are you sure you want to ${operation} "${target}"? This cannot be undone.`,
    default: false,
  });
}
