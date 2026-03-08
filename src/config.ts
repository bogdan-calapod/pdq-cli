import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CONFIG_DIR_NAME = "pdqcli";
const CONFIG_FILE_NAME = "config.json";

interface ConfigFile {
  connectApiKey?: string;
  detectApiKey?: string;
  detectBaseUrl?: string;
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

function writeConfigFile(data: ConfigFile): void {
  const filePath = getConfigFilePath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
  console.log(`Config saved to ${filePath}`);
}

// ---------------------------------------------------------------------------
// PDQ Connect
// ---------------------------------------------------------------------------

/**
 * Resolve the PDQ Connect API key.
 * Priority:
 *   1. PDQ_CONNECT_API_KEY environment variable
 *   2. connectApiKey in $XDG_CONFIG_HOME/pdqcli/config.json
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

export function setConnectApiKey(apiKey: string): void {
  writeConfigFile({ ...readConfigFile(), connectApiKey: apiKey });
}

// ---------------------------------------------------------------------------
// PDQ Detect
// ---------------------------------------------------------------------------

export const DETECT_DEFAULT_BASE_URL = "https://detect.pdq.com";

/**
 * Resolve the PDQ Detect API key.
 * Priority:
 *   1. PDQ_DETECT_API_KEY environment variable
 *   2. detectApiKey in $XDG_CONFIG_HOME/pdqcli/config.json
 */
export function getDetectApiKey(): string {
  const fromEnv = process.env["PDQ_DETECT_API_KEY"];
  if (fromEnv?.trim()) return fromEnv.trim();

  const fromFile = readConfigFile().detectApiKey;
  if (fromFile?.trim()) return fromFile.trim();

  console.error(
    [
      "Error: PDQ Detect API key not found.",
      "",
      "Provide it in one of two ways:",
      "  1. Set the PDQ_DETECT_API_KEY environment variable",
      `  2. Run: pdq detect config set-key <apiKey>`,
      `     (stores in ${getConfigFilePath()})`,
    ].join("\n")
  );
  process.exit(1);
}

export function setDetectApiKey(apiKey: string): void {
  writeConfigFile({ ...readConfigFile(), detectApiKey: apiKey });
}

/**
 * Resolve the PDQ Detect base URL.
 * Priority:
 *   1. --url flag passed at runtime (callers handle this)
 *   2. PDQ_DETECT_URL environment variable
 *   3. detectBaseUrl in config file
 *   4. DETECT_DEFAULT_BASE_URL ("https://detect.pdq.com")
 */
export function getDetectBaseUrl(flagValue?: string): string {
  if (flagValue?.trim()) return flagValue.trim().replace(/\/$/, "");
  const fromEnv = process.env["PDQ_DETECT_URL"];
  if (fromEnv?.trim()) return fromEnv.trim().replace(/\/$/, "");
  const fromFile = readConfigFile().detectBaseUrl;
  if (fromFile?.trim()) return fromFile.trim().replace(/\/$/, "");
  return DETECT_DEFAULT_BASE_URL;
}

export function setDetectBaseUrl(url: string): void {
  writeConfigFile({ ...readConfigFile(), detectBaseUrl: url });
}
