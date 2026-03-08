import { type Command } from "commander";
import { PDQDetectClient } from "./client.js";
import {
  getDetectApiKey,
  getDetectBaseUrl,
  setDetectApiKey,
  setDetectBaseUrl,
} from "../config.js";
import { registerDevicesCommands } from "./devices.js";
import { registerVulnerabilitiesCommands } from "./vulnerabilities.js";
import { registerApplicationsCommands } from "./applications.js";
import { registerScanSurfaceCommands } from "./scan-surface.js";

export function registerDetectCommand(program: Command): void {
  const detect = program
    .command("detect")
    .description("Interact with PDQ Detect")
    .option(
      "--url <baseUrl>",
      "Base URL of your PDQ Detect instance (default: https://detect.pdq.com)"
    );

  // Lazily create the client, picking up the --url flag at call time
  const getClient = (): PDQDetectClient => {
    // Walk up the command tree to find the --url option
    const url = getDetectBaseUrl(detect.opts<{ url?: string }>().url);
    return new PDQDetectClient(getDetectApiKey(), url);
  };

  // ── config ────────────────────────────────────────────────────────────────
  const config = detect
    .command("config")
    .description("Manage PDQ Detect CLI configuration");

  config
    .command("set-key <apiKey>")
    .description("Save the PDQ Detect API key to the local config file")
    .action((apiKey: string) => {
      setDetectApiKey(apiKey);
    });

  config
    .command("set-url <url>")
    .description(
      "Save a custom PDQ Detect base URL to the local config file (for self-hosted instances)"
    )
    .action((url: string) => {
      setDetectBaseUrl(url);
    });

  // ── resource sub-commands ─────────────────────────────────────────────────
  registerDevicesCommands(detect, getClient);
  registerVulnerabilitiesCommands(detect, getClient);
  registerApplicationsCommands(detect, getClient);
  registerScanSurfaceCommands(detect, getClient);
}
