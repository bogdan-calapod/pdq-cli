import { type Command } from "commander";
import { type PDQDetectClient, PDQDetectError } from "./client.js";
import { printTable, type OutputFormat } from "../output.js";

const LIST_COLUMNS = [
  "id",
  "cve",
  "cvssBase",
  "isWeaponized",
  "isExploitable",
  "affectedDevices",
  "affectedApplications",
  "state",
  "publishedDate",
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
    .option("--sort <column>", "Sort column (e.g. cvssBase, publishedDate)")
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
              id: v.id,
              cve: v.cve ?? "",
              cvssBase: v.cvssBase ?? "",
              isWeaponized: v.isWeaponized != null ? String(v.isWeaponized) : "",
              isExploitable: v.isExploitable != null ? String(v.isExploitable) : "",
              affectedDevices: v.affectedDevices ?? "",
              affectedApplications: v.affectedApplications ?? "",
              state: v.state ?? "",
              publishedDate: v.publishedDate ?? "",
            })),
            LIST_COLUMNS,
            opts.output as OutputFormat
          );
        } catch (err) {
          handleError(err);
        }
      }
    );
}

function handleError(err: unknown): never {
  if (err instanceof PDQDetectError) {
    console.error(`Error ${err.status}: ${err.message}`);
  } else {
    console.error("Unexpected error:", err);
  }
  process.exit(1);
}
