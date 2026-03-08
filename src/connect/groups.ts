import { type Command } from "commander";
import { type PDQConnectClient, PDQConnectError } from "./client.js";
import type { Group } from "./types.js";
import { printTable, type OutputFormat } from "../output.js";

const LIST_COLUMNS = ["id", "name", "type", "source", "insertedAt"];

function groupToRow(g: Group): Record<string, unknown> {
  return {
    id: g.id,
    name: g.name ?? "",
    type: g.type ?? "",
    source: g.source ?? "",
    insertedAt: g.insertedAt ?? "",
  };
}

export function registerGroupsCommands(
  parent: Command,
  getClient: () => PDQConnectClient
): void {
  const groups = parent
    .command("groups")
    .description("Manage PDQ Connect groups");

  // ── list ──────────────────────────────────────────────────────────────────
  groups
    .command("list")
    .description("List all groups")
    .option(
      "-f, --filter <key=value...>",
      "Filter groups (e.g. --filter type=dynamic)",
      (val: string, acc: string[]) => [...acc, val],
      [] as string[]
    )
    .option("-s, --sort <field>", "Sort by field (e.g. name, insertedAtDesc)")
    .option(
      "-o, --output <format>",
      "Output format: table, json, csv",
      "table"
    )
    .action(async (opts: { filter: string[]; sort?: string; output: string }) => {
      try {
        const filter = parseFilter(opts.filter);
        const groups = await getClient().listGroups({ filter, sort: opts.sort });
        printTable(groups.map(groupToRow), LIST_COLUMNS, opts.output as OutputFormat);
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
