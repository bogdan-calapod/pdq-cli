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
- `pdq detect <resource> <action>` — PDQ Detect API (not yet implemented)

## Source structure

```
src/
├── index.ts               # Entry: creates root Command, registers sub-CLIs
├── config.ts              # API key resolution (env var → XDG config file)
├── output.ts              # Shared table/json/csv formatter (printTable, printRecord)
└── connect/
    ├── index.ts           # Registers all `pdq connect` subcommands
    ├── client.ts          # PDQConnectClient — typed fetch wrapper with auto-pagination
    ├── types.ts           # TypeScript interfaces from PDQ Connect OpenAPI spec
    ├── devices.ts         # `pdq connect devices list|get`
    ├── groups.ts          # `pdq connect groups list`
    ├── packages.ts        # `pdq connect packages list|get`
    └── deployments.ts     # `pdq connect deployments create`
```

## Key conventions

### Adding a new product (e.g. `pdq detect`)

1. Create `src/detect/` mirroring the `connect/` structure.
2. Create `src/detect/index.ts` that exports `registerDetectCommand(program: Command)`.
3. Register it in `src/index.ts` alongside `registerConnectCommand`.
4. Auth key constant: `PDQ_DETECT_API_KEY` env var; config file key: `detectApiKey`.
5. Add `getDetectApiKey` / `setDetectApiKey` to `src/config.ts`.

### Adding a new resource to an existing product

1. Create `src/connect/<resource>.ts`.
2. Export `register<Resource>Commands(parent: Command, getClient: () => PDQConnectClient)`.
3. Import and call it in `src/connect/index.ts`.
4. Add the necessary types to `src/connect/types.ts`.
5. Add the API method(s) to `src/connect/client.ts`.

### Output formatting

All commands accept `--output table|json|csv` (default: `table`).  
Use `printTable(rows, columns, format)` for lists and `printRecord(obj, format)` for single items — both imported from `../output.js`.

Column projection for table/csv is passed as the second argument to `printTable`. For JSON, all fields are included unless columns are explicitly provided.

### API client patterns

- `client.ts` uses native `fetch` (Node 22 built-in) — no axios or node-fetch.
- Pagination is handled transparently by `getAll()` — callers always receive the full result set.
- Errors surface as `PDQConnectError(status, message)` and are caught in each command's `.action()` handler.
- deepObject filter params (e.g. `filter[os]=windows`) are serialised by spreading `filter[key]=value` entries into the `params` object before passing to `request()`.

### Config / auth

`src/config.ts` resolution order:
1. `PDQ_CONNECT_API_KEY` environment variable
2. `connectApiKey` in `$XDG_CONFIG_HOME/pdqcli/config.json` (falls back to `~/.config/pdqcli/config.json`)

`setConnectApiKey(key)` writes/merges the config file and creates the directory if needed.

## Build & release

```sh
npm run build          # tsc → dist/
npm run pkg:all        # produce all three platform binaries in dist/
```

Releases are triggered by pushing a `v*` tag. The GitHub Actions workflow (`.github/workflows/build.yml`) runs three matrix jobs (linux, macos, windows), uploads artifacts, then a final `release` job attaches all three binaries to the GitHub Release via `softprops/action-gh-release`.

Binary names: `pdq-linux-x64`, `pdq-macos-x64`, `pdq-windows-x64.exe`.

## What to avoid

- Do not switch `package.json` `"type"` to `"module"` — `@yao-pkg/pkg` compiles better from CommonJS. TypeScript targets `"commonjs"` module output.
- Do not add runtime dependencies that require native addons (they won't package cleanly with `pkg`).
- Do not import `node:` protocol modules with dynamic paths — `pkg` bundles statically.
