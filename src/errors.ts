import { PDQConnectError } from "./connect/client.js";
import { PDQDetectError } from "./detect/client.js";

const STATUS_HINTS: Record<number, string> = {
  401: "Check that your API key is valid and has not expired.",
  403: "Your API key may lack the required permissions for this resource.",
  404: "The requested resource was not found. Verify the ID or path is correct.",
  429: "Rate limit exceeded. Wait a moment and try again.",
};

/**
 * Pretty-print an API error and exit the process.
 *
 * Output format:
 *
 *   Error: Unauthorized — check your API key.
 *   Status:  401
 *   Hint:    Check that your API key is valid and has not expired.
 *
 *   An error occurred while performing the request.
 */
export function handleApiError(err: unknown): never {
  console.error();

  if (err instanceof PDQConnectError || err instanceof PDQDetectError) {
    const product = err instanceof PDQConnectError ? "PDQ Connect" : "PDQ Detect";

    console.error(`  Error:   ${err.message}`);
    console.error(`  Status:  ${err.status}`);
    console.error(`  Product: ${product}`);

    const hint = STATUS_HINTS[err.status];
    if (hint) {
      console.error(`  Hint:    ${hint}`);
    }
  } else if (err instanceof TypeError && (err as NodeJS.ErrnoException).code === "ENOTFOUND") {
    console.error(`  Error:   Network error — could not reach the server.`);
    console.error(`  Hint:    Check your internet connection and the configured base URL.`);
  } else if (err instanceof TypeError && err.message.includes("fetch")) {
    console.error(`  Error:   Network error — ${err.message}`);
    console.error(`  Hint:    Check your internet connection and the configured base URL.`);
  } else if (err instanceof Error) {
    console.error(`  Error:   ${err.message}`);
  } else {
    console.error(`  Error:   ${String(err)}`);
  }

  console.error();
  console.error("  An error occurred while performing the request.");
  console.error();

  process.exit(1);
}
