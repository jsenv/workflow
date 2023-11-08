import { UNICODE } from "@jsenv/log";

import { collectWorkspacePackages } from "./internal/collect_workspace_packages.js";
import { fetchWorkspaceLatests } from "./internal/fetch_workspace_latests.js";
import {
  compareTwoPackageVersions,
  VERSION_COMPARE_RESULTS,
} from "./internal/compare_two_package_versions.js";

export const upgradePackagesVersions = async ({ directoryUrl }) => {
  const workspacePackages = await collectWorkspacePackages({ directoryUrl });
  const registryLatestVersions = await fetchWorkspaceLatests(workspacePackages);

  const outdatedPackageNames = [];
  const toPublishPackageNames = [];
  Object.keys(workspacePackages).forEach((packageName) => {
    const workspacePackage = workspacePackages[packageName];
    const workspacePackageVersion = workspacePackage.packageObject.version;
    const registryLatestVersion = registryLatestVersions[packageName];
    const result =
      registryLatestVersion === null
        ? VERSION_COMPARE_RESULTS.GREATER
        : compareTwoPackageVersions(
            workspacePackageVersion,
            registryLatestVersion,
          );
    if (result === VERSION_COMPARE_RESULTS.SMALLER) {
      outdatedPackageNames.push(packageName);
      return;
    }
    if (!workspacePackage.packageObject.private) {
      if (
        result === VERSION_COMPARE_RESULTS.GREATER ||
        result === VERSION_COMPARE_RESULTS.DIFF_TAG
      ) {
        toPublishPackageNames.push(packageName);
      }
    }
  });

  const updates = [];
  if (outdatedPackageNames.length === 0) {
    console.log(`${UNICODE.OK} all versions are up-to-date`);
    return updates;
  }
  for (const outdatedPackageName of outdatedPackageNames) {
    const workspacePackage = workspacePackages[outdatedPackageName];
    workspacePackage.packageObject.version =
      registryLatestVersions[outdatedPackageName];
    workspacePackage.updateFile(workspacePackage.packageObject);
  }
  console.log(
    `${UNICODE.INFO} ${outdatedPackageNames.length} packages versions upgraded
Use a tool like "git diff" to see the new versions then run "npm install"`,
  );
  return updates;
};
