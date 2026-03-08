export const SKILL_CONTENT = `---
name: pdq-cli
description: How to use the pdq CLI to query and manage PDQ Connect and PDQ Detect
license: MIT
compatibility: opencode
metadata:
  tool: pdq-cli
  version: 0.1.0
---

## What this tool does

\`pdq\` is a CLI for PDQ products. Currently supported:
- \`pdq connect\` — query and manage devices, groups, packages, and deployments via the PDQ Connect API
- \`pdq detect\` — query devices, vulnerabilities, applications, and scan surface via the PDQ Detect API

## Authentication

### PDQ Connect
Before using \`pdq connect\` commands the API key must be available via one of:

1. Environment variable (takes priority):
   \`\`\`
   PDQ_CONNECT_API_KEY=your_key pdq connect devices list
   \`\`\`
2. Saved to the local config file (persists across sessions):
   \`\`\`
   pdq connect config set-key <apiKey>
   \`\`\`

### PDQ Detect
Before using \`pdq detect\` commands the API key must be available via one of:

1. Environment variable (takes priority):
   \`\`\`
   PDQ_DETECT_API_KEY=your_key pdq detect devices list
   \`\`\`
2. Saved to the local config file (persists across sessions):
   \`\`\`
   pdq detect config set-key <apiKey>
   \`\`\`

The Detect base URL defaults to \`https://detect.pdq.com\`. Override it via:
- Flag: \`pdq detect --url https://your-instance.example.com devices list\`
- Environment variable: \`PDQ_DETECT_URL=https://... pdq detect devices list\`
- Config file: \`pdq detect config set-url https://...\`

## Output formats

Every list and get command accepts \`--output table|json|csv\` (default: \`table\`).
Use \`--output json\` when you need to process results programmatically.

---

## pdq connect devices

### List all devices
\`\`\`
pdq connect devices list
pdq connect devices list --output json
\`\`\`

### Filter devices
Filter values support operators:
- Exact match: \`os=windows\`
- Contains: \`name=~LAB\`
- Starts with: \`name=^CORP\`
- Ends with: \`name=WS$\`
- Greater than (numeric/date): \`freePercent=>20\`
- Less than: \`memory=<8589934592\`

\`\`\`
pdq connect devices list --filter os=windows
pdq connect devices list --filter name=~LAB --filter requireReboot=true
pdq connect devices list --group grp_abc123
\`\`\`

### Sort devices
\`\`\`
pdq connect devices list --sort lastSeenAtDesc
pdq connect devices list --sort name
\`\`\`
Valid sort fields: \`name\`, \`os\`, \`osVersion\`, \`lastSeenAt\`, \`insertedAt\`, \`updatedAt\`,
\`currentUser\`, \`freePercent\`, \`memory\`, \`hostname\`, \`manufacturer\`, \`model\`,
\`serialNumber\`, \`architecture\`, \`publicIpAddress\`, \`requireReboot\`
(append \`Desc\` for descending order)

### Get a single device
\`\`\`
pdq connect devices get <deviceId>
pdq connect devices get dvc_abc123 --output json
\`\`\`

---

## pdq connect groups

### List all groups
\`\`\`
pdq connect groups list
pdq connect groups list --filter type=dynamic
pdq connect groups list --filter source=custom --output csv
\`\`\`
Valid filter keys: \`id\`, \`name\`, \`type\` (dynamic|static), \`source\` (pdq|custom), \`insertedAt\`

---

## pdq connect packages

### List all packages
\`\`\`
pdq connect packages list
pdq connect packages list --filter name=~Firefox
pdq connect packages list --filter source=pdq --output json
\`\`\`
Valid filter keys: \`name\`, \`publisher\`, \`source\` (pdq|custom)

### Get a single package (includes available versions)
\`\`\`
pdq connect packages get <packageId>
pdq connect packages get pkg_abc123 --output json
\`\`\`
The output includes version IDs (\`pkgver_...\`) which can be used in deployments.

---

## pdq connect deployments

### Deploy a package to devices or groups
\`\`\`
pdq connect deployments create --package <id> --targets <id,...>
\`\`\`

- \`--package\`: a Package ID (\`pkg_...\`) or a specific Package Version ID (\`pkgver_...\`)
- \`--targets\`: comma-separated list of Device IDs (\`dvc_...\`) and/or Group IDs (\`grp_...\`)

Examples:
\`\`\`
# Deploy to a single device
pdq connect deployments create --package pkg_abc123 --targets dvc_xyz789

# Deploy to a group
pdq connect deployments create --package pkg_abc123 --targets grp_lab01

# Deploy a specific version to multiple targets
pdq connect deployments create --package pkgver_abc123 --targets dvc_aaa,dvc_bbb,grp_ccc
\`\`\`

---

## Common workflows

### Find all Windows devices that need a reboot
\`\`\`
pdq connect devices list --filter os=windows --filter requireReboot=true --output json
\`\`\`

### Get all device IDs in a group as JSON
\`\`\`
pdq connect devices list --group grp_abc123 --output json
\`\`\`

### Find a package ID by name, then deploy to a group
\`\`\`
pdq connect packages list --filter name=~Firefox --output json
pdq connect deployments create --package pkg_abc123 --targets grp_lab01
\`\`\`

### Export full device inventory to CSV
\`\`\`
pdq connect devices list --output csv > devices.csv
\`\`\`

---

## pdq detect devices

### List all discovered devices
\`\`\`
pdq detect devices list
pdq detect devices list --output json
\`\`\`

### Filter devices
\`\`\`
pdq detect devices list --name CORP-PC01
pdq detect devices list --os Windows --risk critical
pdq detect devices list --status active --scan-type agent
pdq detect devices list --tags "server,production"
\`\`\`
Filter options: \`--name\`, \`--ip\`, \`--os\`, \`--risk\` (critical|high|medium|low|none),
\`--status\` (active|inactive|unknown), \`--scan-type\` (agent|agentless|network_edge), \`--tags\`

### Sort devices
\`\`\`
pdq detect devices list --sort riskLevel --sort-dir descending
\`\`\`

### Get a single device
\`\`\`
pdq detect devices get <id>
pdq detect devices get <id> overview
pdq detect devices get <id> os
pdq detect devices get <id> users
pdq detect devices get <id> vulnerabilities
pdq detect devices get <id> vulnerabilities --state open
\`\`\`
Device IDs in PDQ Detect are numeric integers (not prefixed strings like Connect).

---

## pdq detect vulnerabilities (alias: vulns)

### List all CVEs in the CVE Manager
\`\`\`
pdq detect vulnerabilities list
pdq detect vulns list --open-only
pdq detect vulns list --filter Log4j --filter-col summary
pdq detect vulns list --sort cvssBase --sort-dir descending --output json
\`\`\`

---

## pdq detect applications (alias: apps)

### List all discovered applications
\`\`\`
pdq detect applications list
pdq detect apps list --risk critical --output json
pdq detect apps list --filter Firefox --sort deviceCount --sort-dir descending
pdq detect apps list --scan-type agent --status active
\`\`\`

### Get a single application
\`\`\`
pdq detect applications get <id>
pdq detect apps get <id> --output json
\`\`\`

---

## pdq detect scan-surface

### List scan surface entries
\`\`\`
pdq detect scan-surface list
pdq detect scan-surface list --scanner <scannerId>
\`\`\`

### Add targets to the scan surface (and trigger a scan)
\`\`\`
pdq detect scan-surface add 192.168.1.0/24
pdq detect scan-surface add host1.corp.local host2.corp.local
pdq detect scan-surface add 10.0.0.50 --no-scan
pdq detect scan-surface add 10.0.0.0/24 --scanner <scannerId>
\`\`\`

### Trigger a rescan of all entries
\`\`\`
pdq detect scan-surface rescan
\`\`\`

### Delete scan surface entries
\`\`\`
pdq detect scan-surface delete <id>
pdq detect scan-surface delete <id1> <id2> --delete-assets
\`\`\`

---

## Common workflows

### Find all critical-risk devices in Detect
\`\`\`
pdq detect devices list --risk critical --output json
\`\`\`

### Export full vulnerability list to CSV
\`\`\`
pdq detect vulns list --open-only --output csv > open-vulns.csv
\`\`\`

### Find all devices running a vulnerable application
\`\`\`
pdq detect apps list --filter Log4j --output json
pdq detect devices get <id> vulnerabilities --state open --output json
\`\`\`

### Add a new subnet to scanning and get results
\`\`\`
pdq detect scan-surface add 10.10.5.0/24
pdq detect devices list --status active --output json
\`\`\`
`;
