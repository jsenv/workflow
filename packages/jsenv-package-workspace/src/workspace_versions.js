import { UNICODE } from "@jsenv/log"

import { collectWorkspacePackages } from "./internal/collect_workspace_packages.js"
import {
  buildDependencyGraph,
  orderByDependencies,
} from "./internal/dependency_graph.js"
import { fetchWorkspaceLatests } from "./internal/fetch_workspace_latests.js"
import {
  compareTwoPackageVersions,
  VERSION_COMPARE_RESULTS,
} from "./internal/compare_two_package_versions.js"
import { increaseVersion } from "./internal/increase_version.js"

export const updateWorkspaceVersions = async ({ directoryUrl }) => {
  const workspacePackages = await collectWorkspacePackages({ directoryUrl })
  const dependencyGraph = buildDependencyGraph(workspacePackages)
  const registryLatestVersions = await fetchWorkspaceLatests(workspacePackages)

  const outdatedPackageNames = []
  const toPublishPackageNames = []
  Object.keys(workspacePackages).forEach((packageName) => {
    const workspacePackage = workspacePackages[packageName]
    const workspacePackageVersion = workspacePackage.packageObject.version
    const registryLatestVersion = registryLatestVersions[packageName]
    const result =
      registryLatestVersion === null
        ? VERSION_COMPARE_RESULTS.GREATER
        : compareTwoPackageVersions(
            workspacePackageVersion,
            registryLatestVersion,
          )
    if (result === VERSION_COMPARE_RESULTS.SMALLER) {
      outdatedPackageNames.push(packageName)
      return
    }
    if (!workspacePackage.packageObject.private) {
      if (
        result === VERSION_COMPARE_RESULTS.GREATER ||
        result === VERSION_COMPARE_RESULTS.DIFF_TAG
      ) {
        toPublishPackageNames.push(packageName)
      }
    }
  })
  if (outdatedPackageNames.length) {
    outdatedPackageNames.forEach((outdatedPackageName) => {
      const workspacePackage = workspacePackages[outdatedPackageName]
      workspacePackage.packageObject.version =
        registryLatestVersions[outdatedPackageName]
      workspacePackage.updateFile(workspacePackage.packageObject)
    })
    console.warn(
      `${UNICODE.WARNING} ${outdatedPackageNames.length} packages updated because they where outdated.
Use a tool like "git diff" to see the new versions and ensure this is what you want`,
    )
    return
  }
  if (toPublishPackageNames.length === 0) {
    console.log(`${UNICODE.OK} packages are published on registry`)
  } else {
    console.log(
      `${UNICODE.INFO} ${
        toPublishPackageNames.length
      } packages could be published
  - ${toPublishPackageNames.map(
    (name) => `${name}@${workspacePackages[name].packageObject.version}`,
  ).join(`
  - `)}`,
    )
  }

  const packageFilesToUpdate = {}
  const versionUpdates = []
  const dependencyUpdates = []
  const updateDependencyVersion = ({
    packageName,
    dependencyType,
    dependencyName,
    from,
    to,
  }) => {
    const packageDeps =
      workspacePackages[packageName].packageObject[dependencyType]
    const version = packageDeps[dependencyName]
    // ignore local deps
    if (
      version.startsWith("./") ||
      version.startsWith("../") ||
      version.startsWith("file:")
    ) {
      return
    }
    dependencyUpdates.push({
      packageName,
      dependencyName,
      from,
      to,
    })
    packageDeps[dependencyName] = to
    packageFilesToUpdate[packageName] = true
  }
  const updateVersion = ({ packageName, from, to }) => {
    const workspacePackage = workspacePackages[packageName]
    versionUpdates.push({
      packageName,
      from,
      to,
    })
    workspacePackage.packageObject.version = to
    packageFilesToUpdate[packageName] = true
  }

  const packageNamesOrderedByDependency = orderByDependencies(dependencyGraph)
  packageNamesOrderedByDependency.forEach((packageName) => {
    const workspacePackage = workspacePackages[packageName]
    const { dependencies = {} } = workspacePackage.packageObject
    Object.keys(dependencies).forEach((dependencyName) => {
      const dependencyAsWorkspacePackage = workspacePackages[dependencyName]
      if (!dependencyAsWorkspacePackage) {
        return
      }
      const versionInDependencies = dependencies[dependencyName]
      const version = dependencyAsWorkspacePackage.packageObject.version
      if (versionInDependencies === version) {
        return
      }
      updateDependencyVersion({
        packageName,
        dependencyType: "dependencies",
        dependencyName,
        from: versionInDependencies,
        to: version,
      })
      if (!toPublishPackageNames.includes(packageName)) {
        updateVersion({
          packageName,
          from: workspacePackage.packageObject.version,
          to: increaseVersion(workspacePackage.packageObject.version),
        })
        if (!workspacePackage.packageObject.private) {
          toPublishPackageNames.push(packageName)
        }
      }
    })
  })
  Object.keys(workspacePackages).forEach((packageName) => {
    const workspacePackage = workspacePackages[packageName]
    const { devDependencies = {} } = workspacePackage.packageObject
    Object.keys(devDependencies).forEach((devDependencyName) => {
      const devDependencyAsWorkspacePackage =
        workspacePackages[devDependencyName]
      if (!devDependencyAsWorkspacePackage) {
        return
      }
      const versionInDevDependencies = devDependencies[devDependencyName]
      const version = devDependencyAsWorkspacePackage.packageObject.version
      if (versionInDevDependencies === version) {
        return
      }
      updateDependencyVersion({
        packageName,
        dependencyType: "devDependencies",
        dependencyName: devDependencyName,
        from: versionInDevDependencies,
        to: version,
      })
    })
  })

  Object.keys(packageFilesToUpdate).forEach((packageName) => {
    const workspacePackage = workspacePackages[packageName]
    workspacePackage.updateFile(workspacePackage.packageObject)
  })

  const updateCount = versionUpdates.length + dependencyUpdates.length
  if (updateCount === 0) {
    console.log(`${UNICODE.OK} all versions in package.json files are in sync`)
  } else {
    console.log(
      `${UNICODE.INFO} ${updateCount} versions updated in package.json files
  Use a tool like "git diff" to review these changes`,
    )
  }
}
