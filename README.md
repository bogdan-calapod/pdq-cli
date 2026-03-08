# pdq-cli

A command-line interface for PDQ products, written in TypeScript.

## Products supported

| Sub-command | Product |
|---|---|
| `pdq connect` | [PDQ Connect](https://www.pdq.com/pdq-connect/) — cloud endpoint management |
| `pdq detect` | [PDQ Detect](https://www.pdq.com/pdq-detect/) — vulnerability and risk management |

## Installation

### Download a pre-built binary

Grab the latest binary for your platform from the [Releases](../../releases) page — no Node.js required.

| Platform | File |
|---|---|
| Linux (x64) | `pdq-linux-x64` |
| macOS (x64) | `pdq-macos-x64` |
| Windows (x64) | `pdq-windows-x64.exe` |

**Linux:**
```sh
chmod +x pdq-linux-x64
sudo mv pdq-linux-x64 /usr/local/bin/pdq
```

**macOS:**
```sh
chmod +x pdq-macos-x64
sudo mv pdq-macos-x64 /usr/local/bin/pdq
```

> [!NOTE]
> **macOS Gatekeeper:** The binary is not notarized (Apple notarization requires a paid Developer account). macOS will block it on first run with *"cannot be opened because the developer cannot be verified"*.
>
> To allow it, remove the quarantine attribute that macOS sets on files downloaded from the internet:
> ```sh
> xattr -d com.apple.quarantine pdq-macos-x64
> ```
> You only need to do this once, before moving the binary to your PATH.
>
> Alternatively, open **System Settings → Privacy & Security**, scroll down to the blocked app notice, and click **Allow Anyway**.

**Windows:**

Rename `pdq-windows-x64.exe` to `pdq.exe` and move it to a directory on your `PATH` (e.g. `C:\tools\`). Windows SmartScreen may show a warning on first run — click **More info → Run anyway**.

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

### PDQ Connect

PDQ Connect uses Bearer token auth. Provide your API key via env var (takes priority) or save it to the config file:

```sh
export PDQ_CONNECT_API_KEY=your_api_key_here
# or persist it:
pdq connect config set-key your_api_key_here
```

Generate an API key in PDQ Connect under **Settings → API Keys**.

### PDQ Detect

PDQ Detect uses a `FootprintApiKey` header. Provide your key via env var or config file:

```sh
export PDQ_DETECT_API_KEY=your_api_key_here
# or persist it:
pdq detect config set-key your_api_key_here
```

The base URL defaults to `https://detect.pdq.com`. Override it if needed:

```sh
export PDQ_DETECT_URL=https://your-instance.example.com
# or persist it:
pdq detect config set-url https://your-instance.example.com
# or pass it inline:
pdq detect --url https://your-instance.example.com devices list
```

## Commands

All list/get commands support `--output table|json|csv` (default: `table`).

<details>
<summary><strong>pdq connect</strong></summary>

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

</details>

<details>
<summary><strong>pdq detect</strong></summary>

### `pdq detect devices`

```sh
# List all discovered devices
pdq detect devices list

# Filter
pdq detect devices list --os Windows --risk critical
pdq detect devices list --status active --scan-type agent
pdq detect devices list --tags "server,production"

# Sort
pdq detect devices list --sort riskLevel --sort-dir descending

# Get a single device (numeric ID)
pdq detect devices get 42
pdq detect devices get 42 os
pdq detect devices get 42 users
pdq detect devices get 42 vulnerabilities --state open
```

### `pdq detect vulnerabilities` (alias: `vulns`)

```sh
pdq detect vulnerabilities list
pdq detect vulns list --open-only
pdq detect vulns list --filter Log4j --filter-col summary
pdq detect vulns list --sort cvssBase --sort-dir descending --output json
```

### `pdq detect applications` (alias: `apps`)

```sh
pdq detect applications list
pdq detect apps list --risk critical
pdq detect apps list --filter Firefox --sort deviceCount --sort-dir descending
pdq detect apps get 123
```

### `pdq detect scan-surface`

```sh
# List scan targets
pdq detect scan-surface list

# Add IPs, hostnames, or CIDR ranges (triggers a scan immediately)
pdq detect scan-surface add 192.168.1.0/24
pdq detect scan-surface add host1.corp.local host2.corp.local --no-scan

# Trigger a full rescan
pdq detect scan-surface rescan

# Remove entries
pdq detect scan-surface delete 7 8 --delete-assets
```

</details>

### `pdq get-skill`

Prints a `SKILL.md` file that tells AI coding assistants how to use this CLI.

```sh
# Print to stdout
pdq get-skill

# Write directly to the OpenCode skills directory
pdq get-skill --out .opencode/skills/pdq-cli/SKILL.md
```

## Contributing

See [DEVELOPMENT.md](./DEVELOPMENT.md) for build instructions, project structure, and release process.

## License

MIT
