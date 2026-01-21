import ora, { type Ora } from 'ora';

let currentSpinner: Ora | null = null;

export function startSpinner(text: string): Ora {
  // Stop any existing spinner
  if (currentSpinner) {
    currentSpinner.stop();
  }

  currentSpinner = ora({
    text,
    spinner: 'dots',
  }).start();

  return currentSpinner;
}

export function stopSpinner(success = true, text?: string): void {
  if (!currentSpinner) return;

  if (success) {
    currentSpinner.succeed(text);
  } else {
    currentSpinner.fail(text);
  }

  currentSpinner = null;
}

export function updateSpinner(text: string): void {
  if (currentSpinner) {
    currentSpinner.text = text;
  }
}

export function failSpinner(text?: string): void {
  stopSpinner(false, text);
}

export async function withSpinner<T>(
  text: string,
  fn: () => Promise<T>,
  options?: {
    successText?: string;
    failText?: string;
  },
): Promise<T> {
  const spinner = startSpinner(text);

  try {
    const result = await fn();
    spinner.succeed(options?.successText);
    return result;
  } catch (error) {
    spinner.fail(options?.failText || (error instanceof Error ? error.message : 'Failed'));
    throw error;
  }
}

// Check if we're in a TTY (interactive terminal)
export function isTTY(): boolean {
  return process.stdout.isTTY;
}
