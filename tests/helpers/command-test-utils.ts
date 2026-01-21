/**
 * Test utilities for command handler testing
 */
import { mock } from 'bun:test';

// Capture console output
export interface ConsoleLogs {
  log: string[];
  error: string[];
  warn: string[];
}

export function captureConsole(): { logs: ConsoleLogs; restore: () => void } {
  const logs: ConsoleLogs = { log: [], error: [], warn: [] };
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  console.log = (...args: unknown[]) => logs.log.push(args.map(String).join(' '));
  console.error = (...args: unknown[]) => logs.error.push(args.map(String).join(' '));
  console.warn = (...args: unknown[]) => logs.warn.push(args.map(String).join(' '));

  return {
    logs,
    restore: () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    },
  };
}

// Mock withSpinner to just execute the function
export function mockSpinner() {
  return mock(async <T>(_text: string, fn: () => Promise<T>): Promise<T> => {
    return fn();
  });
}

// Mock process.exit
export function mockProcessExit(): { exitCode: number | undefined; restore: () => void } {
  const originalExit = process.exit;
  let exitCode: number | undefined;

  process.exit = ((code?: number) => {
    exitCode = code;
    throw new Error(`process.exit(${code})`);
  }) as typeof process.exit;

  return {
    get exitCode() {
      return exitCode;
    },
    restore: () => {
      process.exit = originalExit;
    },
  };
}

// Create a mock client
export function createMockClient() {
  return {
    request: mock(() => Promise.resolve({ success: true, errors: [], warnings: [], data: {} })),
    post: mock(() => Promise.resolve({ success: true, errors: [], warnings: [], data: {} })),
  };
}

// Helper to run a command action
export async function runCommand(
  command: { action: (fn: (...args: unknown[]) => Promise<void>) => unknown },
  ...args: unknown[]
): Promise<void> {
  // Extract the action handler
  const actionHandler = (
    command as unknown as { _actionHandler: (...args: unknown[]) => Promise<void> }
  )._actionHandler;
  if (actionHandler) {
    await actionHandler(...args);
  }
}
