---
name: pdq-cli
description: Guidelines for working on the pdq-cli TypeScript project — structure, conventions, adding commands, and releasing binaries
license: MIT
compatibility: opencode
metadata:
  language: typescript
  runtime: node22
---

## Project overview

`pdq-cli` is a Node.js 22 CLI written in TypeScript, compiled to CommonJS via `tsc`. It uses `commander` for subcommand routing and `cli-table3` for terminal output. Binaries for Linux, macOS, and Windows are produced by `@yao-pkg/pkg` in a GitHub Actions workflow triggered by `v*` tags.

The top-level command is `pdq`. Products are namespaced as sub-commands:

- `pdq connect <resource> <action>` — PDQ Connect API
- `pdq detect <resource> <action>` — PDQ Detect API

## Source structure

```
src/
├── index.ts               # Entry: creates root Command, registers sub-CLIs
├── config.ts              # API key / URL resolution (env var → XDG config file)
├── output.ts              # Shared table/json/csv formatter (printTable, printRecord)
├── skill.ts               # Baked-in SKILL.md string (for `pdq get-skill`)
├── connect/
│   ├── index.ts           # Registers all `pdq connect` subcommands
│   ├── client.ts          # PDQConnectClient — typed fetch wrapper with auto-pagination
│   ├── types.ts           # TypeScript interfaces from PDQ Connect OpenAPI spec
│   ├── devices.ts         # `pdq connect devices list|get`
│   ├── groups.ts          # `pdq connect groups list`
│   ├── packages.ts        # `pdq connect packages list|get`
│   └── deployments.ts     # `pdq connect deployments create`
└── detect/
    ├── index.ts           # Registers all `pdq detect` subcommands
    ├── client.ts          # PDQDetectClient — typed fetch wrapper with auto-pagination
    ├── types.ts           # TypeScript interfaces from CODA Footprint OpenAPI spec
    ├── devices.ts         # `pdq detect devices list|get`
    ├── vulnerabilities.ts # `pdq detect vulnerabilities list`
    ├── applications.ts    # `pdq detect applications list|get`
    └── scan-surface.ts    # `pdq detect scan-surface list|add|rescan|delete`
```

## Key conventions

### Adding a new resource to an existing product

1. Create `src/<product>/<resource>.ts`.
2. Export `register<Resource>Commands(parent: Command, getClient: () => PDQ<Product>Client)`.
3. Import and call it in `src/<product>/index.ts`.
4. Add the necessary types to `src/<product>/types.ts`.
5. Add the API method(s) to `src/<product>/client.ts`.

### Output formatting

All commands accept `--output table|json|csv` (default: `table`).  
Use `printTable(rows, columns, format)` for lists and `printRecord(obj, format)` for single items — both imported from `../output.js`.

Column projection for table/csv is passed as the second argument to `printTable`. For JSON, all fields are included unless columns are explicitly provided.

### API client patterns

- `client.ts` uses native `fetch` (Node 22 built-in) — no axios or node-fetch.
- Pagination is handled transparently — callers always receive the full result set.
  - Connect uses `{ data[] }` pagination; `getAll()` follows `nextCursor`.
  - Detect uses Django REST Framework pagination: `{ count, next, previous, results[] }`; the client loops until `next` is null.
- Errors surface as `PDQConnectError` / `PDQDetectError(status, message)` and are caught in each command's `.action()` handler.
- Connect filter params use deepObject style (e.g. `filter[os]=windows`) serialised as `filter[key]=value` entries.
- **Detect auth uses `FootprintApiKey` header**, not `Authorization: Bearer`. This is different from Connect.

### Config / auth

`src/config.ts` resolution order for each product:

|                      | Connect                   | Detect                   |
| -------------------- | ------------------------- | ------------------------ |
| Env var              | `PDQ_CONNECT_API_KEY`     | `PDQ_DETECT_API_KEY`     |
| Config key           | `connectApiKey`           | `detectApiKey`           |
| Base URL env var     | —                         | `PDQ_DETECT_URL`         |
| Base URL config key  | —                         | `detectBaseUrl`          |
| Base URL default     | `https://connect.pdq.com` | `https://detect.pdq.com` |
| Tenant ID env var    | —                         | `PDQ_DETECT_TENANT_ID`   |
| Tenant ID config key | —                         | `detectTenantId`         |
| Tenant ID default    | —                         | none (omitted if unset)  |

Config file location: `$XDG_CONFIG_HOME/pdqcli/config.json` (falls back to `~/.config/pdqcli/config.json`).

`set*` helpers in `config.ts` write/merge the config file and create the directory if needed.

## Linting & Formatting

ESLint and Prettier are configured. A pre-commit hook (Husky + lint-staged) runs both on staged files.

```sh
npm run lint          # check for lint issues
npm run lint:fix      # auto-fix lint issues
npm run format        # format all files with Prettier
npm run format:check  # check formatting without writing
```

ESLint rules:

- No unused variables/imports (use `_` prefix to ignore)
- Consistent type imports (`import type` for type-only)
- No floating promises
- Non-null assertions warned

Prettier: double quotes, semicolons, 2-space indent, 100 char width.

## Build & release

```sh
npm run lint           # lint first (CI does this)
npm run format:check   # check formatting
npm run build          # tsc → dist/
npm run pkg:linux-x64  # or pkg:linux-arm64, pkg:macos-arm64, pkg:macos-x64, pkg:windows-x64, pkg:windows-arm64
```

Releases are triggered by pushing a `v*` tag. The GitHub Actions workflow (`.github/workflows/build.yml`) runs lint, then six matrix jobs (linux/macos/windows × x64/arm64), uploads artifacts, then a `release` job attaches all binaries to the GitHub Release. A `winget` job submits the Windows binaries to winget-pkgs.

Binary names: `pdq-linux-x64`, `pdq-linux-arm64`, `pdq-macos-arm64`, `pdq-macos-x64`, `pdq-windows-x64.exe`.

## What to avoid

- Do not switch `package.json` `"type"` to `"module"` — `@yao-pkg/pkg` compiles better from CommonJS. TypeScript targets `"commonjs"` module output.
- Do not add runtime dependencies that require native addons (they won't package cleanly with `pkg`).
- Do not import `node:` protocol modules with dynamic paths — `pkg` bundles statically.
