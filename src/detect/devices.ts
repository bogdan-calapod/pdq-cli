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
  "scanType",
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
    status: d.status ?? "",
    scanType: d.scanType ?? "",
    lastSeen: d.lastSeen ?? "",
    lastScanned: d.lastScanned ?? "",
    tags: d.tags?.join(", ") ?? "",
    businessContexts: d.businessContexts?.join(", ") ?? "",
    technicalContexts: d.technicalContexts?.join(", ") ?? "",
  };
}

function overviewToRecord(d: DeviceOverview): Record<string, unknown> {
  return {
    id: d.id,
    name: d.name,
    ip: d.ip ?? "",
    os: d.os ?? "",
    osVersion: d.osVersion ?? "",
    riskLevel: d.riskLevel ?? "",
    status: d.status ?? "",
    scanType: d.scanType ?? "",
    lastSeen: d.lastSeen ?? "",
    lastScanned: d.lastScanned ?? "",
    discovered: d.discovered ?? "",
    vulnerabilities: d.vulnerabilityCount ?? 0,
    critical: d.criticalVulnerabilityCount ?? 0,
    high: d.highVulnerabilityCount ?? 0,
    medium: d.mediumVulnerabilityCount ?? 0,
    low: d.lowVulnerabilityCount ?? 0,
    tags: d.tags?.join(", ") ?? "",
    businessContexts: d.businessContexts?.map((c) => c.name).join(", ") ?? "",
    technicalContexts: d.technicalContexts?.map((c) => c.name).join(", ") ?? "",
  };
}

function osToRecord(os: DeviceOS): Record<string, unknown> {
  return {
    name: os.name ?? "",
    version: os.version ?? "",
    architecture: os.architecture ?? "",
    servicePack: os.servicePack ?? "",
    kernel: os.kernel ?? "",
    buildNumber: os.buildNumber ?? "",
    installDate: os.installDate ?? "",
    lastBootTime: os.lastBootTime ?? "",
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
    .option("--risk <level>", "Filter by risk level (critical, high, medium, low, none)")
    .option("--status <status>", "Filter by status (active, inactive, unknown)")
    .option("--scan-type <type>", "Filter by scan type (agent, agentless, network_edge)")
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
            riskLevel: opts.risk as DeviceListing["riskLevel"],
            status: opts.status as DeviceListing["status"],
            scanType: opts.scanType as DeviceListing["scanType"],
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
    .option("--state <state>", "Filter by state (open, accepted_risk, resolved, ...)")
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
          username: u.username ?? "",
          domain: u.domain ?? "",
          lastLogon: u.lastLogon ?? "",
          isAdmin: u.isAdmin != null ? String(u.isAdmin) : "",
        })),
        ["username", "domain", "lastLogon", "isAdmin"],
        format
      );
    } else {
      const page = await client.getDeviceVulnerabilities(id, {
        state: extra.state,
        search: extra.search,
      });
      printTable(
        page.results.map((v) => ({
          id: v.id,
          cve: v.cve ?? "",
          cvssBase: v.cvssBase ?? "",
          isWeaponized: v.isWeaponized != null ? String(v.isWeaponized) : "",
          state: v.state ?? "",
          summary: (v.summary ?? "").slice(0, 80),
        })),
        ["id", "cve", "cvssBase", "isWeaponized", "state", "summary"],
        format
      );
    }
  } catch (err) {
    handleApiError(err);
  }
}
