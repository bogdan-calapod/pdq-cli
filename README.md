# pdq-cli

A command-line interface for PDQ products, written in TypeScript.

## Products supported

| Sub-command | Product |
|---|---|
| `pdq connect` | [PDQ Connect](https://www.pdq.com/pdq-connect/) — cloud endpoint management |

> `pdq detect` coming soon.

## Installation

### Download a pre-built binary

Grab the latest binary for your platform from the [Releases](../../releases) page — no Node.js required.

| Platform | File |
|---|---|
| Linux (x64) | `pdq-linux-x64` |
| macOS (x64) | `pdq-macos-x64` |
| Windows (x64) | `pdq-windows-x64.exe` |

Make the binary executable (Linux/macOS):

```sh
chmod +x pdq-linux-x64
sudo mv pdq-linux-x64 /usr/local/bin/pdq
```

### Run from source

Requires Node.js 22+.

```sh
git clone https://github.com/your-username/pdq-cli
cd pdq-cli
npm install
npm run build
node dist/index.js --help
# or link globally:
npm link
```

## Authentication

PDQ Connect uses Bearer token auth. Provide your API key in either of these ways (env var takes priority):

**Environment variable:**
```sh
export PDQ_CONNECT_API_KEY=your_api_key_here
```

**Config file** (persisted to `$XDG_CONFIG_HOME/pdqcli/config.json`, defaulting to `~/.config/pdqcli/config.json`):
```sh
pdq connect config set-key your_api_key_here
```

Generate an API key in PDQ Connect under **Settings → API Keys**.

## Commands

### `pdq connect devices`

```sh
# List all devices (table output by default)
pdq connect devices list

# Filter by OS, group, or any device field
pdq connect devices list --filter os=windows
pdq connect devices list --filter name=~LAB --group grp_abc123

# Sort
pdq connect devices list --sort lastSeenAtDesc

# Output as JSON or CSV
pdq connect devices list --output json
pdq connect devices list --output csv > devices.csv

# Get a single device
pdq connect devices get dvc_abc123
```

### `pdq connect groups`

```sh
pdq connect groups list
pdq connect groups list --filter type=dynamic --output json
```

### `pdq connect packages`

```sh
pdq connect packages list
pdq connect packages list --filter name=~Firefox
pdq connect packages get pkg_abc123
```

### `pdq connect deployments`

```sh
# Deploy a package to a device and/or group
pdq connect deployments create \
  --package pkg_abc123 \
  --targets dvc_abc123,grp_xyz456
```

### Global `--output` flag

All list/get commands support `--output table|json|csv` (default: `table`).

## Development

```sh
npm run dev -- connect devices list   # run via tsx (no build step)
npm run build                          # compile TS → dist/
```

### Building binaries locally

```sh
npm run build
npm run pkg:linux    # dist/pdq-linux-x64
npm run pkg:macos    # dist/pdq-macos-x64
npm run pkg:windows  # dist/pdq-windows-x64.exe
npm run pkg:all      # all three
```

### Releasing

Push a version tag to trigger the GitHub Actions build:

```sh
git tag v0.1.0
git push origin v0.1.0
```

The workflow builds Linux, macOS, and Windows executables and attaches them to the GitHub Release automatically.

## Project structure

```
src/
├── index.ts               # Entry point, registers sub-CLIs
├── config.ts              # API key resolution (env var / XDG config)
├── output.ts              # table / json / csv formatter
└── connect/
    ├── index.ts           # `pdq connect` sub-program
    ├── client.ts          # Typed fetch-based API client
    ├── types.ts           # TypeScript types from PDQ Connect OpenAPI spec
    ├── devices.ts         # devices list / get
    ├── groups.ts          # groups list
    ├── packages.ts        # packages list / get
    └── deployments.ts     # deployments create
```

## License

MIT
