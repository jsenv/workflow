/*
 * This script ensure versions in packages are in sync in the workspace
 * I don't want to put "*" in dependencies/devDependencies
 * so that project using packages have predictable dependency versions
 */

import { UNICODE } from "@jsenv/log"
import { readFile, listFilesMatching, writeFile } from "@jsenv/filesystem"

import { projectDirectoryUrl } from "@jsenv/workflow/jsenv.config.mjs"

const packageDirectoryUrls = await listFilesMatching({
  directoryUrl: projectDirectoryUrl,
  patterns: {
    "./packages/*/package.json": true,
  },
})
const workspacePackages = {}
const rootPackageUrl = new URL("package.json", projectDirectoryUrl)
const rootPackageObject = await readFile(rootPackageUrl, {
  as: "json",
})
workspacePackages[rootPackageObject.name] = {
  packageUrl: rootPackageUrl,
  packageObject: rootPackageObject,
}
await Promise.all(
  packageDirectoryUrls.map(async (packageDirectoryUrl) => {
    const packageUrl = new URL("package.json", packageDirectoryUrl)
    const packageObject = await readFile(packageUrl, { as: "json" })
    workspacePackages[packageObject.name] = {
      packageUrl,
      packageObject,
    }
  }),
)
await Object.keys(workspacePackages)
  .sort()
  .reduce(async (previous, packageName) => {
    await previous

    const updates = []
    const { packageObject, packageUrl } = workspacePackages[packageName]
    const { dependencies = {} } = packageObject
    Object.keys(dependencies).forEach((dependencyName) => {
      const workspacePackage = workspacePackages[dependencyName]
      if (!workspacePackage) return
      const versionInPackage = dependencies[dependencyName]
      const version = workspacePackage.packageObject.version
      if (version === versionInPackage) return
      dependencies[dependencyName] = version
      updates.push(dependencyName)
    })
    const { devDependencies = {} } = packageObject
    Object.keys(devDependencies).forEach((devDependencyName) => {
      const workspacePackage = workspacePackages[devDependencyName]
      if (!workspacePackage) return
      const versionInPackage = devDependencies[devDependencyName]
      const version = workspacePackage.packageObject.version
      if (version === versionInPackage) return
      devDependencies[devDependencyName] = version
      updates.push(devDependencyName)
    })

    const updateCount = updates.length
    if (updateCount === 0) {
      console.log(`${UNICODE.OK} ${packageName} version are in sync`)
    } else {
      await writeFile(packageUrl, JSON.stringify(packageObject, null, "  "))
      console.log(
        `${UNICODE.INFO} ${updateCount} version(s) updated for ${packageName}`,
      )
    }
  }, Promise.resolve())
