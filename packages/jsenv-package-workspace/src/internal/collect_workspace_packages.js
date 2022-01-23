import { readFile, listFilesMatching } from "@jsenv/filesystem"

export const collectWorkspacePackages = async ({ directoryUrl }) => {
  const workspacePackages = {}
  const packageDirectoryUrls = await listFilesMatching({
    directoryUrl,
    patterns: {
      "./packages/*/package.json": true,
    },
  })

  const rootPackageUrl = new URL("package.json", directoryUrl)
  const rootPackageObject = await readFile(rootPackageUrl, {
    as: "json",
  })
  workspacePackages[rootPackageObject.name] = {
    isRoot: true,
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
  return workspacePackages
}
