/*
 * - collect all workspaces packages
 * - diff the local version with the version published on NPM
 * - for each version that needs to be published to NPM
 *   - publish it
 *   - update the major/minor/patch of package using this one
 *   - recursively update the package using this one again
 * The script must happen in 2 phase:
 * first phase checks all what should be done and print a report
 * then ask if it can proceed to perfom all the changes
 * (update package.json + publish all what needs to be)
 * It would be a subset of what "lerna" is doing
 */

import { fetchLatestInRegistry } from "@jsenv/package-publish/src/internal/fetchLatestInRegistry.js"
import {
  needsPublish,
  PUBLISH_BECAUSE_NEVER_PUBLISHED,
  PUBLISH_BECAUSE_LATEST_LOWER,
  PUBLISH_BECAUSE_TAG_DIFFERS,
} from "@jsenv/package-publish/src/internal/needsPublish.js"

import { collectWorkspacePackages } from "./internal/collect_workspace_packages.js"

export const publishWorkspace = async ({ directoryUrl }) => {
  const workspacePackages = await collectWorkspacePackages({ directoryUrl })

  await Object.keys(workspacePackages).reduce(async (previous, packageName) => {
    await previous
    const workspacePackage = workspacePackages[packageName]
    const latestPackageInRegistry = await fetchLatestInRegistry({
      registryUrl: "", // TODO
      packageName,
    })
    const registryLatestVersion =
      latestPackageInRegistry === null ? null : latestPackageInRegistry.version
    const needPublishReason = needsPublish({
      packageVersion: workspacePackage.packageObject.version,
      registryLatestVersion,
    })
    workspacePackage.registryLatestVersion = registryLatestVersion
    workspacePackage.publishInfo = {
      needed:
        needPublishReason === PUBLISH_BECAUSE_NEVER_PUBLISHED ||
        needPublishReason === PUBLISH_BECAUSE_LATEST_LOWER ||
        needPublishReason === PUBLISH_BECAUSE_TAG_DIFFERS
          ? "publish"
          : "nothing",
      reason: needPublishReason,
    }
  })

  /*
  TODO: for each package that needs to be published, check which should be published first
  and construct an ordered list of actions that should be performed

  - publish "foo@1.0.0"
  - "bar" changes: 
      - "foo" version: "0.1.0" -> "1.0.0"
      - version: "4.5.0" -> "5.0.0"
  - publish "bar@5.0.0"

  Then ask if script can proceeed

  Then script would perform all actions in sequence
  */
}
