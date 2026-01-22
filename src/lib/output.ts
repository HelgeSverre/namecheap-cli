import chalk from 'chalk';
import Table from 'cli-table3';
import { getDefaultOutput } from './config.js';

export type OutputFormat = 'table' | 'json';

export interface OutputOptions {
  format?: OutputFormat;
  json?: boolean;
  quiet?: boolean;
}

export function getOutputFormat(options: OutputOptions): OutputFormat {
  if (options.json) return 'json';
  if (options.format) return options.format;
  return getDefaultOutput();
}

export function outputJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

export function outputTable(headers: string[], rows: string[][]): void {
  const table = new Table({
    head: headers.map((h) => chalk.cyan.bold(h)),
    style: {
      head: [],
      border: [],
    },
  });

  rows.forEach((row) => table.push(row));
  console.log(table.toString());
}

export function output(
  data: unknown,
  options: OutputOptions,
  tableConfig?: { headers: string[]; rows: (item: unknown) => string[] },
): void {
  const format = getOutputFormat(options);

  if (options.quiet) {
    return;
  }

  if (format === 'json') {
    outputJson(data);
    return;
  }

  if (tableConfig) {
    const items = Array.isArray(data) ? data : [data];
    const rows = items.map(tableConfig.rows);
    outputTable(tableConfig.headers, rows);
  } else {
    // Fallback to JSON if no table config
    outputJson(data);
  }
}

// Styled output helpers
export function success(message: string): void {
  console.log(chalk.green('✓'), message);
}

export function error(message: string): void {
  console.error(chalk.red('✗'), message);
}

export function warning(message: string): void {
  console.warn(chalk.yellow('⚠'), message);
}

export function info(message: string): void {
  console.log(chalk.blue('ℹ'), message);
}

export function dim(message: string): void {
  console.log(chalk.dim(message));
}

// Status indicators
export function statusBadge(
  status: string | boolean,
  trueLabel = 'Yes',
  falseLabel = 'No',
): string {
  if (typeof status === 'boolean') {
    return status ? chalk.green(trueLabel) : chalk.dim(falseLabel);
  }

  const lowercaseStatus = status.toLowerCase();
  if (['active', 'ok', 'enabled', 'locked', 'yes'].includes(lowercaseStatus)) {
    return chalk.green(status);
  }
  if (['expired', 'error', 'disabled', 'no'].includes(lowercaseStatus)) {
    return chalk.red(status);
  }
  if (['pending', 'warning'].includes(lowercaseStatus)) {
    return chalk.yellow(status);
  }
  return status;
}

// Domain-specific formatters
export function formatDate(dateStr: string): string {
  if (!dateStr) return chalk.dim('N/A');
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return dateStr;
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatExpiry(expiryDate: string): string {
  if (!expiryDate) return chalk.dim('N/A');

  const expiry = new Date(expiryDate);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const formatted = formatDate(expiryDate);

  if (daysUntilExpiry < 0) {
    return chalk.red(`${formatted} (expired)`);
  }
  if (daysUntilExpiry < 30) {
    return chalk.red(`${formatted} (${daysUntilExpiry}d)`);
  }
  if (daysUntilExpiry < 90) {
    return chalk.yellow(`${formatted} (${daysUntilExpiry}d)`);
  }
  return formatted;
}

export function formatTtl(ttl: number): string {
  if (ttl < 60) {
    return `${ttl}s`;
  }
  if (ttl < 3600) {
    return `${Math.floor(ttl / 60)}m`;
  }
  if (ttl < 86400) {
    return `${Math.floor(ttl / 3600)}h`;
  }
  return `${Math.floor(ttl / 86400)}d`;
}
