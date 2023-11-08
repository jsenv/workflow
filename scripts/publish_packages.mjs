/*
 * Publish all package if needed (when version found in package file is not already published)
 */

import { readFileSync } from "node:fs";
import { publishPackages } from "@jsenv/monorepo";

if (!process.env.CI) {
  const secrets = JSON.parse(
    String(readFileSync(new URL("../secrets.json", import.meta.url))),
  );
  Object.assign(process.env, secrets);
}
await publishPackages({
  directoryUrl: new URL("../", import.meta.url),
});
