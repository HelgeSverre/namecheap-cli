import packageJson from '../../package.json' with { type: 'json' };

/** Published package name, e.g. `@helgesverre/namecheap-cli`. */
export const PACKAGE_NAME: string = packageJson.name;

/** Current CLI version, read from package.json at build time. */
export const PACKAGE_VERSION: string = packageJson.version;
