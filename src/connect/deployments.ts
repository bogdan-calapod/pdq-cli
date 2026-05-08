import { type Command } from "commander";
import { type PDQConnectClient } from "./client.js";
import { handleApiError } from "../errors.js";

export function registerDeploymentsCommands(
  parent: Command,
  getClient: () => PDQConnectClient
): void {
  const deployments = parent.command("deployments").description("Manage PDQ Connect deployments");

  // ── create ────────────────────────────────────────────────────────────────
  deployments
    .command("create")
    .description("Deploy a package to one or more devices or groups")
    .requiredOption(
      "-p, --package <id>",
      "Package ID or Package Version ID to deploy (e.g. pkg_... or pkgver_...)"
    )
    .requiredOption(
      "-t, --targets <ids>",
      "Comma-separated list of Device IDs and/or Group IDs (e.g. dvc_abc,grp_xyz)"
    )
    .action(async (opts: { package: string; targets: string }) => {
      const targetIds = opts.targets
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      if (targetIds.length === 0) {
        console.error("Error: --targets must contain at least one ID.");
        process.exit(1);
      }

      try {
        await getClient().createDeployment(opts.package, targetIds);
        console.log(
          `Deployment triggered: package=${opts.package} targets=${targetIds.join(", ")}`
        );
      } catch (err) {
        handleApiError(err);
      }
    });
}
