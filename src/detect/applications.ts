import { type Command } from "commander";
import { type PDQDetectClient } from "./client.js";
import type { ApplicationListing } from "./types.js";
import { printRecord, printTable, type OutputFormat } from "../output.js";
import { handleApiError } from "../errors.js";

const LIST_COLUMNS = [
  "id",
  "name",
  "version",
  "publisher",
  "riskLevel",
  "deviceCount",
  "vulnerabilityCount",
  "scanType",
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
    .option("--risk <level>", "Filter by risk level (critical, high, medium, low, none)")
    .option("--scan-type <type>", "Filter by scan type (agent, agentless, network_edge)")
    .option("--status <status>", "Filter by status (active, inactive, unknown)")
    .option("--sort <column>", "Sort column (e.g. name, riskLevel, deviceCount)")
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
            riskLevel: opts.risk as ApplicationListing["riskLevel"],
            scanType: opts.scanType as ApplicationListing["scanType"],
            status: opts.status as ApplicationListing["status"],
            sortColumn: opts.sort,
            sortDirection: opts.sortDir as "ascending" | "descending",
          });

          printTable(
            apps.map((a) => ({
              id: a.id,
              name: a.name,
              version: a.version ?? "",
              publisher: a.publisher ?? "",
              riskLevel: a.riskLevel ?? "",
              deviceCount: a.deviceCount ?? "",
              vulnerabilityCount: a.vulnerabilityCount ?? "",
              scanType: a.scanType ?? "",
              scope: a.scope ?? "",
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
            publisher: app.publisher ?? "",
            riskLevel: app.riskLevel ?? "",
            status: app.status ?? "",
            scanType: app.scanType ?? "",
            deviceCount: app.deviceCount ?? "",
            vulnerabilityCount: app.vulnerabilityCount ?? "",
            critical: app.criticalVulnerabilityCount ?? "",
            high: app.highVulnerabilityCount ?? "",
            medium: app.mediumVulnerabilityCount ?? "",
            low: app.lowVulnerabilityCount ?? "",
            cpeNames: app.cpeNames?.join(", ") ?? "",
          },
          opts.output as OutputFormat
        );
      } catch (err) {
        handleApiError(err);
      }
    });
}
