import { type Command } from "commander";
import { type PDQDetectClient } from "./client.js";
import type { ApplicationListing } from "./types.js";
import { printRecord, printTable, type OutputFormat } from "../output.js";
import { handleApiError } from "../errors.js";

const LIST_COLUMNS = [
  "id",
  "name",
  "version",
  "ip",
  "riskLevel",
  "status",
  "applicationType",
  "lastSeen",
];

export function registerApplicationsCommands(
  parent: Command,
  getClient: () => PDQDetectClient
): void {
  const apps = parent
    .command("applications")
    .alias("apps")
    .description("Query discovered applications");

  // ── list ──────────────────────────────────────────────────────────────────
  apps
    .command("list")
    .description("List all discovered applications")
    .option("-f, --filter <text>", "Text filter (name, publisher, ...)")
    .option("--risk <level>", "Filter by risk level (critical, vulnerable, secure, unknown)")
    .option("--scan-type <type>", "Filter by scan type (all, discovered, scanned)")
    .option("--status <status>", "Filter by status (online, offline, notSeenOnLastScan)")
    .option("--sort <column>", "Sort column (e.g. name, discoveredOn, lastSeen)")
    .option("--sort-dir <dir>", "Sort direction: ascending or descending", "ascending")
    .option("-o, --output <format>", "Output format: table, json, csv", "table")
    .action(
      async (opts: {
        filter?: string;
        risk?: string;
        scanType?: string;
        status?: string;
        sort?: string;
        sortDir?: string;
        output: string;
      }) => {
        try {
          const apps = await getClient().listApplications({
            filter: opts.filter,
            riskLevel: opts.risk,
            scanType: opts.scanType,
            status: opts.status,
            sortColumn: opts.sort,
            sortDirection: opts.sortDir as "ascending" | "descending",
          });

          printTable(
            apps.map((a: ApplicationListing) => ({
              id: a.id,
              name: a.name,
              version: a.version ?? "",
              ip: a.ip ?? "",
              riskLevel: a.riskLevelByCrs ?? String(a.riskLevel ?? ""),
              status: a.status ?? "",
              applicationType: a.applicationType ?? "",
              hostname: a.hostname ?? "",
              port: a.port ?? "",
              protocol: a.protocol ?? "",
              lastSeen: a.lastSeen ?? "",
              discoveredOn: a.discoveredOn ?? "",
              isOnline: String(a.isOnline ?? ""),
            })),
            LIST_COLUMNS,
            opts.output as OutputFormat
          );
        } catch (err) {
          handleApiError(err);
        }
      }
    );

  // ── get ───────────────────────────────────────────────────────────────────
  apps
    .command("get <id>")
    .description("Get details for a single application")
    .option("-o, --output <format>", "Output format: table, json, csv", "table")
    .action(async (id: string, opts: { output: string }) => {
      const numId = parseInt(id, 10);
      if (isNaN(numId)) {
        console.error("Error: application ID must be a number.");
        process.exit(1);
      }
      try {
        const app = await getClient().getApplication(numId);
        printRecord(
          {
            id: app.id,
            name: app.name,
            version: app.version ?? "",
            ip: app.ip ?? "",
            riskLevel: app.riskLevel ?? "",
            status: app.status ?? "",
            applicationType: app.applicationType ?? "",
            hostname: app.hostname ?? "",
            port: app.port ?? "",
            protocol: app.protocol ?? "",
            cpe: app.cpe ?? "",
            numberOfCves: app.numberOfCves ?? 0,
            numberOfAttackAvenues: app.numberOfAttackAvenues ?? 0,
            crss: app.crss ?? "",
            lastSeen: app.lastSeen ?? "",
            discoveredOn: app.discoveredOn ?? "",
          },
          opts.output as OutputFormat
        );
      } catch (err) {
        handleApiError(err);
      }
    });
}
