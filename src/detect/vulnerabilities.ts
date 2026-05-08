import { type Command } from "commander";
import { type PDQDetectClient } from "./client.js";
import { printTable, type OutputFormat } from "../output.js";
import { handleApiError } from "../errors.js";

const LIST_COLUMNS = [
  "cve",
  "severity",
  "cvssBase",
  "isWeaponized",
  "affectedDevices",
  "affectedApplications",
  "firstDiscovered",
  "lastSeen",
];

export function registerVulnerabilitiesCommands(
  parent: Command,
  getClient: () => PDQDetectClient
): void {
  const vulns = parent
    .command("vulnerabilities")
    .alias("vulns")
    .description("Query CVEs across the tenant (CVE Manager)");

  // ── list ──────────────────────────────────────────────────────────────────
  vulns
    .command("list")
    .description("List all CVEs in the CVE Manager")
    .option("-f, --filter <text>", "Text filter")
    .option("--filter-col <column>", "Column to apply text filter to (cve, summary, ...)")
    .option("--open-only", "Only show open (unresolved) vulnerabilities")
    .option("--sort <column>", "Sort column (e.g. cvssBase, severity, lastSeen)")
    .option("--sort-dir <dir>", "Sort direction: ascending or descending", "descending")
    .option("-o, --output <format>", "Output format: table, json, csv", "table")
    .action(
      async (opts: {
        filter?: string;
        filterCol?: string;
        openOnly?: boolean;
        sort?: string;
        sortDir?: string;
        output: string;
      }) => {
        try {
          const vulns = await getClient().listVulnerabilities({
            filter: opts.filter,
            filterColumn: opts.filterCol,
            onlyOpenStates: opts.openOnly,
            sortColumn: opts.sort,
            sortDirection: opts.sortDir as "ascending" | "descending",
          });

          printTable(
            vulns.map((v) => ({
              cve: v.cve ?? "",
              severity: v.severity ?? "",
              cvssBase: v.cvssBase ?? "",
              isWeaponized: v.isWeaponized != null ? String(v.isWeaponized) : "",
              affectedDevices: v.affectedDevicesCount ?? "",
              affectedApplications: v.affectedApplicationsCount ?? "",
              firstDiscovered: v.firstDiscovered ?? "",
              lastSeen: v.lastSeen ?? "",
              summary: (v.summary ?? "").slice(0, 80),
            })),
            LIST_COLUMNS,
            opts.output as OutputFormat
          );
        } catch (err) {
          handleApiError(err);
        }
      }
    );
}
