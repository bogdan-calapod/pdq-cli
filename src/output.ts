import Table from "cli-table3";

export type OutputFormat = "table" | "json" | "csv";

/**
 * Print an array of objects in the requested format.
 *
 * @param rows    Array of flat objects (values will be stringified)
 * @param columns Ordered list of keys to include; if omitted all keys are used
 * @param format  Output format
 */
export function printTable(
  rows: Array<Record<string, unknown>>,
  columns: string[] | undefined,
  format: OutputFormat
): void {
  if (rows.length === 0) {
    if (format === "json") {
      console.log("[]");
    } else {
      console.log("No results.");
    }
    return;
  }

  const keys = columns ?? Object.keys(rows[0]);

  if (format === "json") {
    // For JSON, print the full rows (not just selected columns) unless columns
    // were explicitly requested, in which case we project.
    const projected = columns
      ? rows.map((r) => Object.fromEntries(keys.map((k) => [k, r[k] ?? null])))
      : rows;
    console.log(JSON.stringify(projected, null, 2));
    return;
  }

  if (format === "csv") {
    console.log(keys.map(csvEscape).join(","));
    for (const row of rows) {
      console.log(keys.map((k) => csvEscape(String(row[k] ?? ""))).join(","));
    }
    return;
  }

  // table
  const table = new Table({
    head: keys,
    style: { head: ["cyan"] },
    wordWrap: false,
  });

  for (const row of rows) {
    table.push(keys.map((k) => String(row[k] ?? "")));
  }

  console.log(table.toString());
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Print a single object as a two-column key/value table.
 */
export function printRecord(record: Record<string, unknown>, format: OutputFormat): void {
  if (format === "json") {
    console.log(JSON.stringify(record, null, 2));
    return;
  }

  if (format === "csv") {
    console.log("key,value");
    for (const [k, v] of Object.entries(record)) {
      const val = typeof v === "object" ? JSON.stringify(v) : String(v ?? "");
      console.log(`${csvEscape(k)},${csvEscape(val)}`);
    }
    return;
  }

  const table = new Table({
    style: { head: ["cyan"] },
  });

  for (const [k, v] of Object.entries(record)) {
    const val = typeof v === "object" ? JSON.stringify(v) : String(v ?? "");
    table.push({ [k]: val });
  }

  console.log(table.toString());
}
