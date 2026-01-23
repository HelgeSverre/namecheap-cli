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

export interface AuthPromptResult {
  credentials: AuthCredentials;
  sandbox: boolean;
}

const IP_SERVICES = [
  { url: 'https://api.ipify.org?format=json', parse: (data: { ip: string }) => data.ip },
  { url: 'https://api.my-ip.io/v2/ip.json', parse: (data: { ip: string }) => data.ip },
  { url: 'https://ipinfo.io/json', parse: (data: { ip: string }) => data.ip },
  { url: 'https://api.ip.sb/jsonip', parse: (data: { ip: string }) => data.ip },
];

export async function detectPublicIp(): Promise<string | null> {
  for (const service of IP_SERVICES) {
    try {
      const response = await fetch(service.url, {
        signal: AbortSignal.timeout(3000),
      });
      if (response.ok) {
        const data = (await response.json()) as { ip: string };
        const ip = service.parse(data);
        if (ip) return ip;
      }
    } catch {
      // Try next service
    }
  }
  return null;
}

export async function promptAuthCredentials(options?: {
  usernameOverride?: string;
}): Promise<AuthPromptResult> {
  console.log('\nEnter your Namecheap API credentials:');
  console.log('(Get your API key from: https://ap.www.namecheap.com/settings/tools/apiaccess/)\n');

  const apiUser = await promptText('API User (your Namecheap username):');
  const apiKey = await promptPassword('API Key:');

  // userName defaults to apiUser, only ask if override provided
  const userName = options?.usernameOverride || apiUser;

  // Try to auto-detect public IP
  const detectedIp = await detectPublicIp();
  const ipPrompt = detectedIp
    ? `Your whitelisted IP address (detected: ${detectedIp}):`
    : 'Your whitelisted IP address:';

  let clientIp = await promptText(ipPrompt, detectedIp || undefined);

  // Validate IP is not empty
  while (!clientIp.trim()) {
    console.log('IP address is required by Namecheap API.');
    clientIp = await promptText('Your whitelisted IP address:');
  }

  // Ask about sandbox mode
  const sandbox = await promptConfirm('Use sandbox environment?', false);

  return {
    credentials: { apiUser, apiKey, userName, clientIp: clientIp.trim() },
    sandbox,
  };
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
