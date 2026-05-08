import { type Command } from "commander";
import { PDQDetectClient } from "./client.js";
import {
  getDetectApiKey,
  getDetectBaseUrl,
  getDetectTenantId,
  setDetectApiKey,
  setDetectBaseUrl,
  setDetectTenantId,
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
    )
    .option("--tenant <tenantId>", "Tenant ID to scope API requests to");

  // Lazily create the client, picking up the --url and --tenant flags at call time
  const getClient = (): PDQDetectClient => {
    const opts = detect.opts<{ url?: string; tenant?: string }>();
    const rootOpts = detect.parent?.opts<{ debug?: boolean }>() ?? {};
    const url = getDetectBaseUrl(opts.url);
    const tenantId = getDetectTenantId(opts.tenant);
    return new PDQDetectClient(getDetectApiKey(), url, tenantId, rootOpts.debug);
  };

  // ── config ────────────────────────────────────────────────────────────────
  const config = detect.command("config").description("Manage PDQ Detect CLI configuration");

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

  config
    .command("set-tenant <tenantId>")
    .description("Save the PDQ Detect tenant ID to the local config file")
    .action((tenantId: string) => {
      const id = Number(tenantId);
      if (!Number.isInteger(id) || id <= 0) {
        console.error("Error: tenant ID must be a positive integer.");
        process.exit(1);
      }
      setDetectTenantId(id);
    });

  // ── resource sub-commands ─────────────────────────────────────────────────
  registerDevicesCommands(detect, getClient);
  registerVulnerabilitiesCommands(detect, getClient);
  registerApplicationsCommands(detect, getClient);
  registerScanSurfaceCommands(detect, getClient);
}
