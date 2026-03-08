import { type Command } from "commander";
import { type PDQDetectClient, PDQDetectError } from "./client.js";
import { printTable, type OutputFormat } from "../output.js";

const LIST_COLUMNS = [
  "id",
  "userInput",
  "scannerName",
  "assetCount",
  "status",
  "lastScan",
  "scope",
];

export function registerScanSurfaceCommands(
  parent: Command,
  getClient: () => PDQDetectClient
): void {
  const ss = parent
    .command("scan-surface")
    .description("Manage the scan surface (targets to scan)");

  // ── list ──────────────────────────────────────────────────────────────────
  ss.command("list")
    .description("List all scan surface entries")
    .option("--scanner <id>", "Filter by scanner ID")
    .option("-f, --filter <text>", "Text filter")
    .option("-o, --output <format>", "Output format: table, json, csv", "table")
    .action(
      async (opts: { scanner?: string; filter?: string; output: string }) => {
        try {
          const entries = await getClient().listScanSurface({
            scannerId: opts.scanner,
            textFilter: opts.filter,
          });
          printTable(
            entries.map((e) => ({
              id: e.id,
              userInput: e.userInput,
              scannerId: e.scannerId ?? "",
              scannerName: e.scannerName ?? "",
              assetCount: e.assetCount ?? "",
              lastScan: e.lastScan ?? "",
              status: e.status ?? "",
              scope: e.scope ?? "",
            })),
            LIST_COLUMNS,
            opts.output as OutputFormat
          );
        } catch (err) {
          handleError(err);
        }
      }
    );

  // ── add ───────────────────────────────────────────────────────────────────
  ss.command("add <targets...>")
    .description(
      "Add one or more IPs, hostnames, or CIDR ranges to the scan surface and trigger a scan"
    )
    .option("--scanner <id>", "Target a specific scanner ID")
    .option(
      "--no-scan",
      "Add to scan surface without triggering an immediate scan"
    )
    .action(
      async (
        targets: string[],
        opts: { scanner?: string; scan: boolean }
      ) => {
        try {
          const results = await getClient().addScanSurface(
            targets,
            opts.scanner,
            !opts.scan
          );
          if (results.length === 0) {
            console.log("Added to scan surface.");
          } else {
            printTable(
              results.map((r) => ({
                scanUuid: r.scanUuid,
                scannerId: r.scannerId,
              })),
              ["scanUuid", "scannerId"],
              "table"
            );
          }
        } catch (err) {
          handleError(err);
        }
      }
    );

  // ── rescan ────────────────────────────────────────────────────────────────
  ss.command("rescan")
    .description("Trigger a rescan of all entries across all active scanners")
    .action(async () => {
      try {
        const results = await getClient().rescanAll();
        console.log(`Rescan triggered for ${results.length} scanner(s).`);
        printTable(
          results.map((r) => ({ scanUuid: r.scanUuid, scannerId: r.scannerId })),
          ["scanUuid", "scannerId"],
          "table"
        );
      } catch (err) {
        handleError(err);
      }
    });

  // ── delete ────────────────────────────────────────────────────────────────
  ss.command("delete <ids...>")
    .description("Delete scan surface entries by their numeric IDs")
    .option(
      "--delete-assets",
      "Also delete the assets discovered from these entries"
    )
    .action(async (ids: string[], opts: { deleteAssets?: boolean }) => {
      const numIds = ids.map((id) => parseInt(id, 10));
      const invalid = numIds.filter(isNaN);
      if (invalid.length > 0) {
        console.error(`Error: non-numeric IDs provided: ${ids.filter((_, i) => isNaN(numIds[i])).join(", ")}`);
        process.exit(1);
      }
      try {
        await getClient().deleteScanSurface(numIds, opts.deleteAssets);
        console.log(`Deleted ${numIds.length} scan surface entry/entries.`);
      } catch (err) {
        handleError(err);
      }
    });
}

function handleError(err: unknown): never {
  if (err instanceof PDQDetectError) {
    console.error(`Error ${err.status}: ${err.message}`);
  } else {
    console.error("Unexpected error:", err);
  }
  process.exit(1);
}
