# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
bun run dev              # Run CLI in development
bun run src/index.ts     # Run directly
bun run build            # Build for production (outputs to dist/)
bun install              # Install dependencies
```

## Architecture

### Command Structure

Uses Commander.js with a hierarchical command pattern. Each command group (auth, domains, dns, ns, users, whoisguard, config) has its own directory under `src/commands/` with an `index.ts` that exports the command group.

Individual commands are separate files that export a Command instance:

```
src/commands/dns/
├── index.ts    # Exports dnsCommand with subcommands attached
├── list.ts     # listCommand
├── add.ts      # addCommand
└── ...
```

### API Layer

The API client (`src/lib/api/client.ts`) is a singleton `NamecheapClient` class:

- Use `getClient()` to get the singleton instance
- Handles both GET (`request()`) and POST (`post()`) methods
- Automatically includes authentication credentials from config
- Use `NamecheapClient.handleResponse()` to extract data and throw on API errors

API responses are XML, parsed by `src/lib/api/parser.ts` using fast-xml-parser. Each domain-specific parser function (e.g., `parseDnsHosts`, `parseDomainList`) handles the Namecheap response structure quirks (single items vs arrays).

### Configuration

Uses the `conf` library (`src/lib/config.ts`) with schema validation. Config stored at OS-appropriate location (accessible via `namecheap config path`). Key functions:

- `getCredentials()` / `setCredentials()` - API auth
- `isSandboxMode()` - switches between production/sandbox endpoints
- `getDefaultOutput()` - table or json format

### Output Pattern

Commands use `output()` from `src/lib/output.ts` with a table config:

```typescript
output(data, options, {
  headers: ['Col1', 'Col2'],
  rows: (item) => [item.field1, item.field2],
});
```

All commands support `--json` flag for JSON output.

### Error Handling

Wrap command actions with try/catch and call `handleError(error)` from `src/utils/errors.ts`. Use `validateDomain(domain)` before API calls.

### Async Operations

Use `withSpinner(message, asyncFn)` from `src/utils/spinner.ts` for operations with loading indicators.

## API Notes

- Namecheap API returns XML (single items vs arrays need normalization)
- API requires IP whitelisting at Namecheap account settings
- Two environments: Production (`api.namecheap.com`) and Sandbox (`api.sandbox.namecheap.com`)
- All API commands are typed in `ApiCommand` union type (`src/lib/api/types.ts`)

## Testing

Uses Bun's built-in test runner. Run tests with `bun test`.

### Test Commands

```bash
bun test              # Run all tests
bun test --watch      # Watch mode
bun test --coverage   # With coverage
```

### Test Patterns

**API Mocking** - Mock `global.fetch` to return XML responses:

```typescript
function mockFetch(xml: string) {
  const mockFn = mock(() => Promise.resolve(new Response(xml, { status: 200 })));
  global.fetch = mockFn as unknown as typeof fetch;
  return mockFn;
}
```

**Command Testing** - Use Commander.js `parseAsync` to invoke commands:

```typescript
// Track spies for cleanup
let spies: Mock<unknown>[];
function trackSpy<T>(spy: Mock<T>): Mock<T> {
  spies.push(spy as Mock<unknown>);
  return spy;
}

beforeEach(() => {
  spies = [];
  trackSpy(spyOn(client, 'getClient').mockReturnValue(mockClient));
  trackSpy(spyOn(spinner, 'withSpinner').mockImplementation(async (_text, fn) => fn()));
});

afterEach(() => {
  spies.forEach((spy) => spy.mockRestore());
});

test('command test', async () => {
  trackSpy(spyOn(api, 'someFunction').mockResolvedValue(data));

  const program = new Command();
  program.addCommand(someCommand);
  await program.parseAsync(['node', 'test', 'command', 'args']);

  expect(logs.some((l) => l.includes('expected output'))).toBe(true);
});
```

**Console Capture** - Capture console output for assertions:

```typescript
let logs: string[];
beforeEach(() => {
  logs = [];
  originalLog = console.log;
  console.log = (...args) => logs.push(args.map(String).join(' '));
});
afterEach(() => {
  console.log = originalLog;
});
```

### Test Structure

- `tests/lib/` - Unit tests for library functions
- `tests/commands/` - Integration tests for CLI commands
- `tests/fixtures/` - XML response fixtures
- `tests/helpers/` - Test utilities
