/*
 * Publish all package if needed (the local package version must not be published)
 */

import { readFileSync } from "node:fs"

import { publishWorkspace } from "@jsenv/package-workspace"

if (!process.env.CI) {
  const secrets = JSON.parse(
    String(readFileSync(new URL("../secrets.json", import.meta.url))),
  )
  Object.assign(process.env, secrets)
}
await publishWorkspace({
  directoryUrl: new URL("../", import.meta.url),
})
