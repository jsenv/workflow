import { writeFile } from "@jsenv/filesystem"
import { fetchLatestInRegistry } from "@jsenv/package-publish/src/internal/fetchLatestInRegistry.js"
import { UNICODE } from "@jsenv/log"

import { collectWorkspacePackages } from "./internal/collect_workspace_packages.js"
import { buildDependencyGraph } from "./internal/dependency_graph.js"
import {
  compareTwoPackageVersions,
  VERSION_COMPARE_RESULTS,
} from "./internal/compare_two_package_versions.js"
import { increaseVersion } from "./internal/increase_version.js"

export const updateWorkspaceVersions = async ({ directoryUrl }) => {
  const workspacePackages = await collectWorkspacePackages({ directoryUrl })
  const dependencyGraph = buildDependencyGraph(workspacePackages)
  await Object.keys(workspacePackages).reduce(async (previous, packageName) => {
    await previous
    const workspacePackage = workspacePackages[packageName]
    const latestPackageInRegistry = await fetchLatestInRegistry({
      registryUrl: "https://registry.npmjs.org",
      packageName,
    })
    const registryLatestVersion =
      latestPackageInRegistry === null ? null : latestPackageInRegistry.version
    workspacePackage.registryLatestVersion = registryLatestVersion
  })

  const outdatedPackageNames = []
  const toPublishPackageNames = []
  Object.keys(workspacePackages).forEach((packageName) => {
    const workspacePackage = workspacePackages[packageName]
    const { registryLatestVersion } = workspacePackage
    const result =
      registryLatestVersion === null
        ? VERSION_COMPARE_RESULTS.BIGGER
        : compareTwoPackageVersions(
            workspacePackage.packageObject.version,
            registryLatestVersion,
          )
    if (result === VERSION_COMPARE_RESULTS.SMALLER) {
      outdatedPackageNames.push(packageName)
      return
    }
    if (
      result === VERSION_COMPARE_RESULTS.BIGGER ||
      result === VERSION_COMPARE_RESULTS.DIFF_TAG
    ) {
      toPublishPackageNames.push(packageName)
      return
    }
  })
  if (outdatedPackageNames.length) {
    console.warn(
      `${UNICODE.WARNING} ${outdatedPackageNames.length} package(s) versions updated because they where outdated.
Use a tool like "git diff" to see the new versions and ensure this is what you want`,
    )
    return
  }
  if (toPublishPackageNames.length === 0) {
    console.log(`${UNICODE.OK} package(s) version are published`)
  } else {
    console.log(
      `${UNICODE.INFO} ${toPublishPackageNames.length} package(s) version could be published`,
    )
  }

  const packageFilesToUpdate = {}
  const versionUpdates = []
  const dependencyUpdates = []
  const updateDependencyVersion = ({
    packageName,
    dependencyType,
    dependencyName,
    version,
  }) => {
    const workspacePackage = workspacePackages[packageName]
    const dependencyVersions = workspacePackage.packageObject[dependencyType]
    dependencyUpdates.push({
      packageName,
      dependencyName,
      from: dependencyVersions[dependencyName],
      to: version,
    })
    dependencyVersions[dependencyName] = version
    packageFilesToUpdate[packageName] = true
  }
  const updateVersion = ({ packageName, version }) => {
    const workspacePackage = workspacePackages[packageName]
    versionUpdates.push({
      packageName,
      from: workspacePackage.packageObject.version,
      to: version,
    })
    workspacePackage.packageObject.version = version
    packageFilesToUpdate[packageName] = true
  }

  const visitPackageThatShouldBePublished = (packageName) => {
    dependencyGraph[packageName].dependents.forEach((dependentPackageName) => {
      const version = workspacePackages[packageName].packageObject.version
      const dependentPackageObject =
        workspacePackages[dependentPackageName].packageObject
      const versionInDependentPackage =
        dependentPackageObject.dependencies[packageName].version
      if (versionInDependentPackage !== version) {
        updateDependencyVersion({
          packageName: dependentPackageName,
          dependencyType: "dependencies",
          dependencyName: packageName,
          version,
        })
      }
      if (!toPublishPackageNames.includes(dependentPackageName)) {
        updateVersion({
          packageName: dependentPackageName,
          version: increaseVersion(version, "patch"),
        })
        toPublishPackageNames.push(dependentPackageName)
        visitPackageThatShouldBePublished(dependentPackageName)
      }
    })
  }
  toPublishPackageNames.forEach((toPublishPackageName) => {
    visitPackageThatShouldBePublished(toPublishPackageName)
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
      const version = devDependencyAsWorkspacePackage.packageObject.version
      const versionInDependentPackage = workspacePackage.packageObject.version
      if (versionInDependentPackage === version) {
        return
      }
      updateDependencyVersion({
        packageName,
        dependencyType: "devDependencies",
        dependencyName: devDependencyName,
        version,
      })
    })
  })

  await Promise.all(
    Object.keys(packageFilesToUpdate).keys.map(async (packageName) => {
      const workspacePackage = workspacePackages[packageName]
      await writeFile(
        workspacePackage.packageUrl,
        JSON.stringify(workspacePackage.packageObject, null, "  "),
      )
    }),
  )
  const updateCount = versionUpdates.length + dependencyUpdates.length
  if (updateCount === 0) {
    console.log(
      `${UNICODE.OK} versions in workspace package.json files are in sync`,
    )
  } else {
    console.log(
      `${UNICODE.INFO} ${updateCount} versions updated in package.json files`,
    )
  }
}
