# Development

## Prerequisites

- Node.js 22+
- npm

```sh
git clone https://github.com/your-username/pdq-cli
cd pdq-cli
npm install
```

## Running locally

```sh
# Run without a build step via tsx
npm run dev -- connect devices list
npm run dev -- detect devices list

# Compile TypeScript → dist/
npm run build

# Run the compiled output
node dist/index.js --help
```

## Linting & Formatting

ESLint and Prettier are configured for consistent code style. A pre-commit hook runs automatically via Husky + lint-staged.

```sh
npm run lint          # check for lint issues
npm run lint:fix      # auto-fix lint issues
npm run format        # format all files with Prettier
npm run format:check  # check formatting without writing
```

ESLint rules enforced:

- No unused variables/imports (prefix with `_` to ignore)
- Consistent type imports (`import type` for type-only imports)
- No floating promises
- No explicit `any` (warning)
- Non-null assertions flagged as warnings

Prettier config (`.prettierrc`):

- Double quotes, semicolons, trailing commas (ES5)
- 2-space indentation, 100 char line width

## Building binaries

Binaries are produced by [`@yao-pkg/pkg`](https://github.com/nicolo-ribaudo/pkg) (the maintained community fork of `pkg`), which bundles the compiled JS and the Node 22 runtime into a single executable.

```sh
npm run build

# Linux
npm run pkg:linux-x64      # dist/pdq-linux-x64
npm run pkg:linux-arm64    # dist/pdq-linux-arm64

# macOS
npm run pkg:macos-arm64    # dist/pdq-macos-arm64 (Apple Silicon)
npm run pkg:macos-x64      # dist/pdq-macos-x64   (Intel)

# Windows (ARM64 not supported by pkg)
npm run pkg:windows-x64    # dist/pdq-windows-x64.exe
```

## Releasing

Push a version tag to trigger the GitHub Actions build:

```sh
git tag v0.1.0
git push origin v0.1.0
```

The [build workflow](.github/workflows/build.yml) compiles and packages Linux, macOS, and Windows executables and attaches them to the GitHub Release automatically.

## Project structure

```
src/
├── index.ts               # Entry point — registers all sub-CLIs
├── config.ts              # API key / URL resolution (env var → config file)
├── output.ts              # table / json / csv formatter
├── skill.ts               # Baked-in SKILL.md string (for `pdq get-skill`)
├── connect/
│   ├── index.ts           # `pdq connect` command tree
│   ├── client.ts          # Typed fetch-based PDQ Connect API client
│   ├── types.ts           # TypeScript types from PDQ Connect OpenAPI spec
│   ├── devices.ts         # devices list / get
│   ├── groups.ts          # groups list
│   ├── packages.ts        # packages list / get
│   └── deployments.ts     # deployments create
└── detect/
    ├── index.ts           # `pdq detect` command tree
    ├── client.ts          # Typed fetch-based PDQ Detect API client
    ├── types.ts           # TypeScript types from CODA Footprint OpenAPI spec
    ├── devices.ts         # devices list / get (overview, os, users, vulns)
    ├── vulnerabilities.ts # vulnerabilities list (CVE Manager)
    ├── applications.ts    # applications list / get
    └── scan-surface.ts    # scan-surface list / add / rescan / delete
```

## Architecture notes

- **CommonJS output** — `tsconfig.json` targets CommonJS (not ESM). This is required for `@yao-pkg/pkg` binary compilation; ESM entry points are not supported by the packager.
- **Auth resolution** — `src/config.ts` resolves credentials in priority order: CLI flag → environment variable → XDG config file (`$XDG_CONFIG_HOME/pdqcli/config.json`, defaulting to `~/.config/pdqcli/config.json`). Detect also supports an optional tenant ID (`--tenant` flag / `PDQ_DETECT_TENANT_ID` env var / `detectTenantId` config key) which is sent as the `tId` query parameter on every API request.
- **PDQ Detect auth** — The Detect API uses a `FootprintApiKey` HTTP header, not `Authorization: Bearer`. This is different from PDQ Connect.
- **Detect pagination** — The Detect API follows Django REST Framework pagination: `{ count, next, previous, results[] }`. The client auto-paginates to collect all results before returning.
- **`pdq get-skill`** — The user-facing `SKILL.md` is baked into the binary as a string constant in `src/skill.ts` at compile time. Update that file whenever commands change, then rebuild.
