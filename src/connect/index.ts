import { type Command } from "commander";
import { PDQConnectClient } from "./client.js";
import { getConnectApiKey, setConnectApiKey } from "../config.js";
import { registerDevicesCommands } from "./devices.js";
import { registerGroupsCommands } from "./groups.js";
import { registerPackagesCommands } from "./packages.js";
import { registerDeploymentsCommands } from "./deployments.js";

export function registerConnectCommand(program: Command): void {
  const connect = program.command("connect").description("Interact with PDQ Connect");

  // Lazily create the client — only after the API key is resolved at runtime
  const getClient = (): PDQConnectClient => {
    const rootOpts = connect.parent?.opts<{ debug?: boolean }>() ?? {};
    return new PDQConnectClient(getConnectApiKey(), rootOpts.debug);
  };

  // ── config ────────────────────────────────────────────────────────────────
  const config = connect.command("config").description("Manage PDQ Connect CLI configuration");

  config
    .command("set-key <apiKey>")
    .description("Save the PDQ Connect API key to the local config file")
    .action((apiKey: string) => {
      setConnectApiKey(apiKey);
    });

  // ── resource sub-commands ─────────────────────────────────────────────────
  registerDevicesCommands(connect, getClient);
  registerGroupsCommands(connect, getClient);
  registerPackagesCommands(connect, getClient);
  registerDeploymentsCommands(connect, getClient);
}
