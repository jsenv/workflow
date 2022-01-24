import { writeFile } from "@jsenv/filesystem"
import { fetchLatestInRegistry } from "@jsenv/package-publish/src/internal/fetchLatestInRegistry.js"
import { UNICODE } from "@jsenv/log"

import { collectWorkspacePackages } from "./internal/collect_workspace_packages.js"
import {
  buildDependencyGraph,
  orderByDependencies,
} from "./internal/dependency_graph.js"
import {
  compareTwoPackageVersions,
  VERSION_COMPARE_RESULTS,
} from "./internal/compare_two_package_versions.js"
import { increaseVersion } from "./internal/increase_version.js"

export const updateWorkspaceVersions = async ({ directoryUrl }) => {
  const workspacePackages = await collectWorkspacePackages({ directoryUrl })
  Object.keys(workspacePackages).forEach((key) => {
    if (workspacePackages[key].packageObject.private) {
      delete workspacePackages[key]
    }
  })
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
  }, Promise.resolve())

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
      result === VERSION_COMPARE_RESULTS.GREATER ||
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
    from,
    to,
  }) => {
    const dependencyVersions =
      workspacePackages[packageName].packageObject[dependencyType]
    dependencyUpdates.push({
      packageName,
      dependencyName,
      from,
      to,
    })
    dependencyVersions[dependencyName] = to
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
      const versionInDependencies =
        workspacePackage.packageObject.dependencies[dependencyName].version
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
          version: increaseVersion(
            workspacePackage.packageObject.version,
            "patch",
          ),
        })
        toPublishPackageNames.push(packageName)
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

  await Promise.all(
    Object.keys(packageFilesToUpdate).map(async (packageName) => {
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
