import { Command } from "commander";
import { PDQConnectClient, PDQConnectError } from "./client.js";
import type { Package } from "./types.js";
import { printRecord, printTable, type OutputFormat } from "../output.js";

const LIST_COLUMNS = ["id", "name", "publisher", "source"];

function packageToRow(p: Package): Record<string, unknown> {
  return {
    id: p.id,
    name: p.name ?? "",
    publisher: p.publisher ?? "",
    source: p.source ?? "",
  };
}

function packageToDetailRow(p: Package): Record<string, unknown> {
  const versions =
    p.packageVersions
      ?.map(
        (v) =>
          `${v.id} — ${v.displayVersion ?? v.version ?? "?"} (${v.releasedAt?.slice(0, 10) ?? "?"})`
      )
      .join("\n") ?? "";

  return {
    id: p.id,
    name: p.name ?? "",
    publisher: p.publisher ?? "",
    source: p.source ?? "",
    versions,
  };
}

export function registerPackagesCommands(
  parent: Command,
  getClient: () => PDQConnectClient
): void {
  const packages = parent
    .command("packages")
    .description("Manage PDQ Connect packages");

  // ── list ──────────────────────────────────────────────────────────────────
  packages
    .command("list")
    .description("List all packages")
    .option(
      "-f, --filter <key=value...>",
      "Filter packages (e.g. --filter name=~Firefox)",
      (val: string, acc: string[]) => [...acc, val],
      [] as string[]
    )
    .option("-s, --sort <field>", "Sort by field (e.g. name, nameDesc)")
    .option(
      "-o, --output <format>",
      "Output format: table, json, csv",
      "table"
    )
    .action(async (opts: { filter: string[]; sort?: string; output: string }) => {
      try {
        const filter = parseFilter(opts.filter);
        const packages = await getClient().listPackages({ filter, sort: opts.sort });
        printTable(packages.map(packageToRow), LIST_COLUMNS, opts.output as OutputFormat);
      } catch (err) {
        handleError(err);
      }
    });

  // ── get ───────────────────────────────────────────────────────────────────
  packages
    .command("get <id>")
    .description("Get a package with its available versions")
    .option(
      "-o, --output <format>",
      "Output format: table, json, csv",
      "table"
    )
    .action(async (id: string, opts: { output: string }) => {
      try {
        const pkg = await getClient().getPackage(id);
        printRecord(packageToDetailRow(pkg), opts.output as OutputFormat);
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
