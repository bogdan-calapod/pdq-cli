import { type Command } from "commander";
import { type PDQDetectClient } from "./client.js";
import { printTable, type OutputFormat } from "../output.js";
import { handleApiError } from "../errors.js";

const LIST_COLUMNS = ["id", "input", "user", "scanDate", "scanners"];

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
    .action(async (opts: { scanner?: string; filter?: string; output: string }) => {
      try {
        const entries = await getClient().listScanSurface({
          scannerId: opts.scanner ? Number(opts.scanner) : undefined,
          textFilter: opts.filter,
        });
        printTable(
          entries.map((e) => ({
            id: e.id,
            input: e.input,
            user: e.user?.username ?? "",
            scanDate: e.scanDate ?? "",
            scanners:
              e.scanners?.map((s) => `${s.scannerName ?? s.scannerId ?? "?"}`).join(", ") ?? "",
          })),
          LIST_COLUMNS,
          opts.output as OutputFormat
        );
      } catch (err) {
        handleApiError(err);
      }
    });

  // ── add ───────────────────────────────────────────────────────────────────
  ss.command("add <targets...>")
    .description(
      "Add one or more IPs, hostnames, or CIDR ranges to the scan surface and trigger a scan"
    )
    .requiredOption(
      "--scanners <ids>",
      "Comma-separated scanner IDs to use for scanning",
      (val: string) =>
        val
          .split(",")
          .map((s) => Number(s.trim()))
          .filter((n) => !isNaN(n))
    )
    .option("--no-scan", "Add to scan surface without triggering an immediate scan")
    .action(async (targets: string[], opts: { scanners: number[]; scan: boolean }) => {
      try {
        if (opts.scanners.length === 0) {
          console.error("Error: --scanners must contain at least one numeric scanner ID.");
          process.exit(1);
        }
        const results = await getClient().addScanSurface(targets, opts.scanners, !opts.scan);
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
        handleApiError(err);
      }
    });

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
        handleApiError(err);
      }
    });

  // ── delete ────────────────────────────────────────────────────────────────
  ss.command("delete <ids...>")
    .description("Delete scan surface entries by their numeric IDs")
    .option("--delete-assets", "Also delete the assets discovered from these entries")
    .action(async (ids: string[], opts: { deleteAssets?: boolean }) => {
      const numIds = ids.map((id) => parseInt(id, 10));
      const invalid = numIds.filter(isNaN);
      if (invalid.length > 0) {
        console.error(
          `Error: non-numeric IDs provided: ${ids.filter((_, i) => isNaN(numIds[i])).join(", ")}`
        );
        process.exit(1);
      }
      try {
        await getClient().deleteScanSurface(numIds, opts.deleteAssets);
        console.log(`Deleted ${numIds.length} scan surface entry/entries.`);
      } catch (err) {
        handleApiError(err);
      }
    });
}
