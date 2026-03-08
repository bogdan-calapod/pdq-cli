import { type Command } from "commander";
import { type PDQConnectClient, PDQConnectError } from "./client.js";
import type { Device } from "./types.js";
import { printRecord, printTable, type OutputFormat } from "../output.js";

// Columns shown in list view
const LIST_COLUMNS = [
  "id",
  "name",
  "os",
  "osVersion",
  "lastSeenAt",
  "currentUser",
  "publicIpAddress",
  "requireReboot",
];

function deviceToRow(d: Device): Record<string, unknown> {
  return {
    id: d.id,
    name: d.name ?? "",
    hostname: d.hostname ?? "",
    os: d.os ?? "",
    osVersion: d.osVersion ?? "",
    osFullName: d.osFullName ?? "",
    architecture: d.architecture ?? "",
    manufacturer: d.manufacturer ?? "",
    model: d.model ?? "",
    serialNumber: d.serialNumber ?? "",
    memory: d.memory != null ? `${Math.round(d.memory / 1024 / 1024)} MB` : "",
    freePercent: d.freePercent != null ? `${d.freePercent}%` : "",
    currentUser: d.currentUser ?? "",
    lastUser: d.lastUser ?? "",
    publicIpAddress: d.publicIpAddress ?? "",
    macAddress: d.macAddress ?? "",
    requireReboot: d.requireReboot != null ? String(d.requireReboot) : "",
    lastSeenAt: d.lastSeenAt ?? "",
    insertedAt: d.insertedAt ?? "",
  };
}

export function registerDevicesCommands(parent: Command, getClient: () => PDQConnectClient): void {
  const devices = parent.command("devices").description("Manage PDQ Connect devices");

  // ── list ──────────────────────────────────────────────────────────────────
  devices
    .command("list")
    .description("List all devices")
    .option("-g, --group <id>", "Filter by group ID")
    .option(
      "-f, --filter <key=value...>",
      "Filter devices (e.g. --filter os=windows --filter name=~LAB)",
      (val: string, acc: string[]) => [...acc, val],
      [] as string[]
    )
    .option("-s, --sort <field>", "Sort by field (e.g. name, lastSeenAtDesc)")
    .option("-o, --output <format>", "Output format: table, json, csv", "table")
    .action(async (opts: { group?: string; filter: string[]; sort?: string; output: string }) => {
      try {
        const filter = parseFilter(opts.filter);
        const devices = await getClient().listDevices({
          group: opts.group,
          filter,
          sort: opts.sort,
        });
        const rows = devices.map(deviceToRow);
        printTable(rows, LIST_COLUMNS, opts.output as OutputFormat);
      } catch (err) {
        handleError(err);
      }
    });

  // ── get ───────────────────────────────────────────────────────────────────
  devices
    .command("get <id>")
    .description("Get details for a single device")
    .option("-o, --output <format>", "Output format: table, json, csv", "table")
    .action(async (id: string, opts: { output: string }) => {
      try {
        const device = await getClient().getDevice(id);
        printRecord(deviceToRow(device), opts.output as OutputFormat);
      } catch (err) {
        handleError(err);
      }
    });
}

function parseFilter(pairs: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const pair of pairs) {
    const eq = pair.indexOf("=");
    if (eq === -1) {
      console.error(`Invalid filter "${pair}" — expected key=value`);
      process.exit(1);
    }
    result[pair.slice(0, eq)] = pair.slice(eq + 1);
  }
  return result;
}

function handleError(err: unknown): never {
  if (err instanceof PDQConnectError) {
    console.error(`Error ${err.status}: ${err.message}`);
  } else {
    console.error("Unexpected error:", err);
  }
  process.exit(1);
}
