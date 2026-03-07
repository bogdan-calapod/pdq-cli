import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CONFIG_DIR_NAME = "pdqcli";
const CONFIG_FILE_NAME = "config.json";

interface ConfigFile {
  connectApiKey?: string;
}

function getConfigFilePath(): string {
  const xdgConfigHome =
    process.env["XDG_CONFIG_HOME"] ?? path.join(os.homedir(), ".config");
  return path.join(xdgConfigHome, CONFIG_DIR_NAME, CONFIG_FILE_NAME);
}

function readConfigFile(): ConfigFile {
  const filePath = getConfigFilePath();
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as ConfigFile;
  } catch {
    return {};
  }
}

/**
 * Resolve the PDQ Connect API key.
 * Priority:
 *   1. PDQ_CONNECT_API_KEY environment variable
 *   2. connectApiKey in $XDG_CONFIG_HOME/pdqcli/config.json
 *
 * Exits with a clear error if neither is set.
 */
export function getConnectApiKey(): string {
  const fromEnv = process.env["PDQ_CONNECT_API_KEY"];
  if (fromEnv?.trim()) return fromEnv.trim();

  const fromFile = readConfigFile().connectApiKey;
  if (fromFile?.trim()) return fromFile.trim();

  console.error(
    [
      "Error: PDQ Connect API key not found.",
      "",
      "Provide it in one of two ways:",
      "  1. Set the PDQ_CONNECT_API_KEY environment variable",
      `  2. Run: pdq connect config set-key <apiKey>`,
      `     (stores in ${getConfigFilePath()})`,
    ].join("\n")
  );
  process.exit(1);
}

/**
 * Persist the PDQ Connect API key to the XDG config file.
 */
export function setConnectApiKey(apiKey: string): void {
  const filePath = getConfigFilePath();
  const dir = path.dirname(filePath);

  fs.mkdirSync(dir, { recursive: true });

  const existing = readConfigFile();
  const updated: ConfigFile = { ...existing, connectApiKey: apiKey };
  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2) + "\n", "utf-8");

  console.log(`API key saved to ${filePath}`);
}
