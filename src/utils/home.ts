import { homedir } from 'node:os';

/**
 * The user's home directory.
 *
 * Honours `$HOME` when set (matching Node's `os.homedir()` on POSIX). Bun's
 * `os.homedir()` ignores `$HOME` changes made at runtime, so reading the env
 * var directly lets tests redirect every on-disk path to a sandbox.
 */
export function getHomeDir(): string {
  return process.env.HOME || homedir();
}
