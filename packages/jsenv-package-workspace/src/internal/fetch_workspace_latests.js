import { fetchLatestInRegistry } from "@jsenv/package-publish/src/internal/fetchLatestInRegistry.js"

export const fetchWorkspaceLatests = async (workspacePackages) => {
  const latestVersions = {}
  await Object.keys(workspacePackages).reduce(async (previous, packageName) => {
    await previous
    const latestPackageInRegistry = await fetchLatestInRegistry({
      registryUrl: "https://registry.npmjs.org",
      packageName,
    })
    const registryLatestVersion =
      latestPackageInRegistry === null ? null : latestPackageInRegistry.version
    latestVersions[packageName] = registryLatestVersion
  }, Promise.resolve())
  return latestVersions
}