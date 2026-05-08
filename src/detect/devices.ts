import { type Command } from "commander";
import { type PDQDetectClient } from "./client.js";
import type { DeviceListing, DeviceOverview, DeviceOS } from "./types.js";
import { printRecord, printTable, type OutputFormat } from "../output.js";
import { handleApiError } from "../errors.js";

const LIST_COLUMNS = [
  "id",
  "name",
  "ip",
  "os",
  "riskLevel",
  "status",
  "scanSource",
  "lastSeen",
  "lastScanned",
];

function deviceListingToRow(d: DeviceListing): Record<string, unknown> {
  return {
    id: d.id,
    name: d.name,
    ip: d.ip ?? "",
    os: d.os ?? "",
    riskLevel: d.riskLevel ?? "",
    status: d.deviceState ?? "",
    scanSource: d.scanSource ?? "",
    scanType: d.scanType ?? "",
    lastSeen: d.lastSeen ?? "",
    lastScanned: d.lastScanned ?? "",
    discoveredOn: d.discoveredOn ?? "",
    isOnline: String(d.isOnline ?? ""),
    scanner: d.scanner?.name ?? "",
    tags: d.tags?.map((t) => t.name ?? "").join(", ") ?? "",
    businessContexts: d.businessContextsNames?.join(", ") ?? "",
    technicalContexts: d.technicalContextsNames?.join(", ") ?? "",
  };
}

function overviewToRecord(d: DeviceOverview): Record<string, unknown> {
  return {
    os: d.os ?? "",
    installDate: d.installDate ?? "",
    lastBootupDate: d.lastBootupDate ?? "",
    securityProducts: d.securityProducts ?? "",
    firewallProfiles: d.firewallProfiles ?? "",
    applications: d.applications?.length ?? 0,
    installedUpdates: d.installedUpdates?.length ?? 0,
  };
}

function osToRecord(os: DeviceOS): Record<string, unknown> {
  return {
    osType: os.osType ?? "",
    isOutdated: String(os.isOutdated ?? ""),
    isSpring4shellAvailable: String(os.isSpring4shellAvailable ?? ""),
  };
}

export function registerDevicesCommands(parent: Command, getClient: () => PDQDetectClient): void {
  const devices = parent.command("devices").description("Manage PDQ Detect devices");

  // ── list ──────────────────────────────────────────────────────────────────
  devices
    .command("list")
    .description("List all discovered devices")
    .option("--name <name>", "Filter by device name")
    .option("--ip <ip>", "Filter by IP address")
    .option("--os <os>", "Filter by OS string")
    .option("--risk <level>", "Filter by risk level (critical, vulnerable, secure, unknown)")
    .option(
      "--status <status>",
      "Filter by status (online, offline, notSeenOnLastScan, decommissioned)"
    )
    .option("--scan-type <type>", "Filter by scan type")
    .option("--tags <tags>", "Filter by tag(s), comma-separated")
    .option("--sort <column>", "Sort column (e.g. name, riskLevel, lastSeen)")
    .option("--sort-dir <dir>", "Sort direction: ascending or descending", "ascending")
    .option("-o, --output <format>", "Output format: table, json, csv", "table")
    .action(
      async (opts: {
        name?: string;
        ip?: string;
        os?: string;
        risk?: string;
        status?: string;
        scanType?: string;
        tags?: string;
        sort?: string;
        sortDir?: string;
        output: string;
      }) => {
        try {
          const devices = await getClient().listDevices({
            name: opts.name,
            ip: opts.ip,
            os: opts.os,
            riskLevel: opts.risk,
            status: opts.status,
            scanType: opts.scanType,
            tags: opts.tags,
            sortColumn: opts.sort,
            sortDirection: opts.sortDir as "ascending" | "descending",
          });
          printTable(devices.map(deviceListingToRow), LIST_COLUMNS, opts.output as OutputFormat);
        } catch (err) {
          handleApiError(err);
        }
      }
    );

  // ── get ───────────────────────────────────────────────────────────────────
  const get = devices
    .command("get <id>")
    .description("Get details for a single device")
    .option("-o, --output <format>", "Output format: table, json, csv", "table");

  get
    .command("overview")
    .description("General overview (default)")
    .option("-o, --output <format>", "Output format: table, json, csv", "table")
    .action(async (opts: { output: string }, cmd: Command) => {
      const id = parseInt(cmd.parent!.args[0] ?? "", 10);
      await fetchAndPrint(id, "overview", getClient, opts.output as OutputFormat);
    });

  get
    .command("os")
    .description("Operating system information")
    .option("-o, --output <format>", "Output format: table, json, csv", "table")
    .action(async (opts: { output: string }, cmd: Command) => {
      const id = parseInt(cmd.parent!.args[0] ?? "", 10);
      await fetchAndPrint(id, "os", getClient, opts.output as OutputFormat);
    });

  get
    .command("users")
    .description("Users associated with the device")
    .option("-o, --output <format>", "Output format: table, json, csv", "table")
    .action(async (opts: { output: string }, cmd: Command) => {
      const id = parseInt(cmd.parent!.args[0] ?? "", 10);
      await fetchAndPrint(id, "users", getClient, opts.output as OutputFormat);
    });

  get
    .command("vulnerabilities")
    .description("Vulnerabilities on the device")
    .option("--state <state>", "Filter by state (discovered, acceptRisk, fixConfirmed, ...)")
    .option("--search <text>", "Search term")
    .option("-o, --output <format>", "Output format: table, json, csv", "table")
    .action(async (opts: { state?: string; search?: string; output: string }, cmd: Command) => {
      const id = parseInt(cmd.parent!.args[0] ?? "", 10);
      await fetchAndPrint(id, "vulnerabilities", getClient, opts.output as OutputFormat, opts);
    });

  // Default action for `pdq detect devices get <id>` (no sub-command) → overview
  get.action(async (id: string, opts: { output: string }) => {
    await fetchAndPrint(parseInt(id, 10), "overview", getClient, opts.output as OutputFormat);
  });
}

async function fetchAndPrint(
  id: number,
  resource: "overview" | "os" | "users" | "vulnerabilities",
  getClient: () => PDQDetectClient,
  format: OutputFormat,
  extra: { state?: string; search?: string } = {}
): Promise<void> {
  if (isNaN(id)) {
    console.error("Error: device ID must be a number.");
    process.exit(1);
  }
  try {
    const client = getClient();
    if (resource === "overview") {
      printRecord(overviewToRecord(await client.getDeviceOverview(id)), format);
    } else if (resource === "os") {
      printRecord(osToRecord(await client.getDeviceOS(id)), format);
    } else if (resource === "users") {
      const users = await client.getDeviceUsers(id);
      printTable(
        users.map((u) => ({
          name: u.name ?? "",
          accountType: u.accountType ?? "",
          description: u.description ?? "",
          disabled: u.disabled ?? "",
          passwordExpires: u.passwordExpires ?? "",
        })),
        ["name", "accountType", "description", "disabled", "passwordExpires"],
        format
      );
    } else {
      const page = await client.getDeviceVulnerabilities(id, {
        state: extra.state,
        search: extra.search,
      });
      printTable(
        page.items.map((v) => ({
          id: v.id,
          cve: v.cve ?? "",
          cvssScore: v.cvssScore ?? "",
          state: v.state ?? "",
          severity: v.cvssBaseSeverity ?? "",
          summary: (v.summary ?? "").slice(0, 80),
        })),
        ["id", "cve", "cvssScore", "state", "severity", "summary"],
        format
      );
    }
  } catch (err) {
    handleApiError(err);
  }
}
