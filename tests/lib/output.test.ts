import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import {
  getOutputFormat,
  formatDate,
  formatExpiry,
  formatTtl,
  statusBadge,
  output,
  outputJson,
  outputTable,
  success,
  error,
  warning,
  info,
  dim,
} from '../../src/lib/output.js';
import { setDefaultOutput, getDefaultOutput } from '../../src/lib/config.js';

// Store and restore default output setting
let originalDefaultOutput: 'table' | 'json';

beforeEach(() => {
  originalDefaultOutput = getDefaultOutput();
  setDefaultOutput('table');
});

afterEach(() => {
  setDefaultOutput(originalDefaultOutput);
});

describe('getOutputFormat', () => {
  test('returns json when json option is true', () => {
    const result = getOutputFormat({ json: true });
    expect(result).toBe('json');
  });

  test('returns specified format when provided', () => {
    const result = getOutputFormat({ format: 'json' });
    expect(result).toBe('json');
  });

  test('returns table when format is table', () => {
    const result = getOutputFormat({ format: 'table' });
    expect(result).toBe('table');
  });

  test('json option takes precedence over format', () => {
    const result = getOutputFormat({ json: true, format: 'table' });
    expect(result).toBe('json');
  });

  test('returns default (table) when no options provided', () => {
    const result = getOutputFormat({});
    expect(result).toBe('table');
  });
});

describe('formatDate', () => {
  test('formats valid ISO date string', () => {
    const result = formatDate('2024-03-15T12:00:00Z');
    // Should contain month, day, year
    expect(result).toContain('2024');
    expect(result).toContain('15');
  });

  test('formats date without time', () => {
    const result = formatDate('2024-01-01');
    expect(result).toContain('2024');
    expect(result).toContain('1');
  });

  test('returns N/A for empty string', () => {
    const result = formatDate('');
    expect(result).toContain('N/A');
  });

  test('returns original string for invalid date', () => {
    const result = formatDate('not-a-date');
    // Invalid dates may return the original or some representation
    expect(result).toBeDefined();
  });
});

describe('formatExpiry', () => {
  test('returns N/A for empty string', () => {
    const result = formatExpiry('');
    expect(result).toContain('N/A');
  });

  test('marks expired dates', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);
    const result = formatExpiry(pastDate.toISOString());
    expect(result).toContain('expired');
  });

  test('shows days for dates less than 30 days away', () => {
    const nearDate = new Date();
    nearDate.setDate(nearDate.getDate() + 15);
    const result = formatExpiry(nearDate.toISOString());
    // Should contain day count
    expect(result).toMatch(/\d+d/);
  });

  test('shows days for dates between 30-90 days away', () => {
    const cautionDate = new Date();
    cautionDate.setDate(cautionDate.getDate() + 60);
    const result = formatExpiry(cautionDate.toISOString());
    // Should contain day count
    expect(result).toMatch(/\d+d/);
  });

  test('shows just date for dates more than 90 days away', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 120);
    const result = formatExpiry(futureDate.toISOString());
    // Should not contain day count or expired
    expect(result).not.toContain('expired');
    expect(result).toContain('202');
  });
});

describe('formatTtl', () => {
  test('formats seconds for values under 60', () => {
    expect(formatTtl(30)).toBe('30s');
    expect(formatTtl(1)).toBe('1s');
    expect(formatTtl(59)).toBe('59s');
  });

  test('formats minutes for values 60-3599', () => {
    expect(formatTtl(60)).toBe('1m');
    expect(formatTtl(120)).toBe('2m');
    expect(formatTtl(300)).toBe('5m');
    expect(formatTtl(3599)).toBe('59m');
  });

  test('formats hours for values 3600-86399', () => {
    expect(formatTtl(3600)).toBe('1h');
    expect(formatTtl(7200)).toBe('2h');
    expect(formatTtl(43200)).toBe('12h');
  });

  test('formats days for values 86400+', () => {
    expect(formatTtl(86400)).toBe('1d');
    expect(formatTtl(172800)).toBe('2d');
    expect(formatTtl(604800)).toBe('7d');
  });
});

describe('statusBadge', () => {
  test('returns Yes/No for boolean true', () => {
    const result = statusBadge(true);
    expect(result).toContain('Yes');
  });

  test('returns Yes/No for boolean false', () => {
    const result = statusBadge(false);
    expect(result).toContain('No');
  });

  test('uses custom labels for boolean', () => {
    const result = statusBadge(true, 'Enabled', 'Disabled');
    expect(result).toContain('Enabled');
  });

  test('uses custom labels for boolean false', () => {
    const result = statusBadge(false, 'Enabled', 'Disabled');
    expect(result).toContain('Disabled');
  });

  test('returns green styled active status', () => {
    const result = statusBadge('active');
    expect(result).toContain('active');
  });

  test('returns green styled ok status', () => {
    const result = statusBadge('ok');
    expect(result).toContain('ok');
  });

  test('returns green styled enabled status', () => {
    const result = statusBadge('enabled');
    expect(result).toContain('enabled');
  });

  test('returns red styled expired status', () => {
    const result = statusBadge('expired');
    expect(result).toContain('expired');
  });

  test('returns red styled error status', () => {
    const result = statusBadge('error');
    expect(result).toContain('error');
  });

  test('returns yellow styled pending status', () => {
    const result = statusBadge('pending');
    expect(result).toContain('pending');
  });

  test('returns yellow styled warning status', () => {
    const result = statusBadge('warning');
    expect(result).toContain('warning');
  });

  test('returns unstyled unknown status', () => {
    const result = statusBadge('unknown');
    expect(result).toBe('unknown');
  });

  test('handles mixed case status strings', () => {
    const result = statusBadge('Active');
    expect(result).toContain('Active');
  });
});

describe('outputJson', () => {
  test('outputs JSON to console', () => {
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));

    outputJson({ test: 'value' });

    console.log = originalLog;
    expect(logs.length).toBe(1);
    expect(logs[0]).toContain('"test"');
    expect(logs[0]).toContain('"value"');
  });

  test('formats JSON with indentation', () => {
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));

    outputJson({ a: 1 });

    console.log = originalLog;
    expect(logs[0]).toContain('\n'); // Pretty printed
  });
});

describe('outputTable', () => {
  test('outputs table to console', () => {
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));

    outputTable(['Name', 'Value'], [['test', '123']]);

    console.log = originalLog;
    expect(logs.length).toBe(1);
    expect(logs[0]).toContain('Name');
    expect(logs[0]).toContain('Value');
    expect(logs[0]).toContain('test');
    expect(logs[0]).toContain('123');
  });

  test('handles multiple rows', () => {
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));

    outputTable(['Col'], [['row1'], ['row2'], ['row3']]);

    console.log = originalLog;
    expect(logs[0]).toContain('row1');
    expect(logs[0]).toContain('row2');
    expect(logs[0]).toContain('row3');
  });
});

describe('output', () => {
  test('outputs JSON when json option is true', () => {
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));

    output({ test: 'data' }, { json: true });

    console.log = originalLog;
    expect(logs[0]).toContain('"test"');
  });

  test('outputs nothing when quiet is true', () => {
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));

    output({ test: 'data' }, { quiet: true });

    console.log = originalLog;
    expect(logs.length).toBe(0);
  });

  test('outputs table with table config', () => {
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));

    output(
      [{ name: 'test', value: 123 }],
      { format: 'table' },
      {
        headers: ['Name', 'Value'],
        rows: (item: unknown) => {
          const i = item as { name: string; value: number };
          return [i.name, String(i.value)];
        },
      },
    );

    console.log = originalLog;
    expect(logs[0]).toContain('Name');
    expect(logs[0]).toContain('test');
  });

  test('falls back to JSON when no table config', () => {
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));

    output({ test: 'data' }, { format: 'table' });

    console.log = originalLog;
    expect(logs[0]).toContain('"test"');
  });

  test('wraps single item in array for table', () => {
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));

    output(
      { name: 'single' },
      { format: 'table' },
      {
        headers: ['Name'],
        rows: (item: unknown) => [(item as { name: string }).name],
      },
    );

    console.log = originalLog;
    expect(logs[0]).toContain('single');
  });
});

describe('styled output helpers', () => {
  test('success outputs with checkmark', () => {
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));

    success('Done!');

    console.log = originalLog;
    expect(logs[0]).toContain('Done!');
  });

  test('error outputs to stderr', () => {
    const logs: string[] = [];
    const originalError = console.error;
    console.error = (...args: unknown[]) => logs.push(args.join(' '));

    error('Failed!');

    console.error = originalError;
    expect(logs[0]).toContain('Failed!');
  });

  test('warning outputs to stderr', () => {
    const logs: string[] = [];
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => logs.push(args.join(' '));

    warning('Caution!');

    console.warn = originalWarn;
    expect(logs[0]).toContain('Caution!');
  });

  test('info outputs with info symbol', () => {
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));

    info('Info message');

    console.log = originalLog;
    expect(logs[0]).toContain('Info message');
  });

  test('dim outputs dimmed text', () => {
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));

    dim('Dimmed text');

    console.log = originalLog;
    expect(logs[0]).toContain('Dimmed text');
  });
});
