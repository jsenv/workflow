import { urlToRelativeUrl } from "@jsenv/urls"
import { readFile, listFilesMatching, writeFile } from "@jsenv/filesystem"

export const collectWorkspacePackages = async ({ directoryUrl }) => {
  const workspacePackages = {}
  const rootPackageUrl = new URL("package.json", directoryUrl)
  const rootPackageFileInfo = await readPackageFile(rootPackageUrl)
  const rootPackage = {
    isRoot: true,
    packageUrl: rootPackageUrl,
    packageObject: rootPackageFileInfo.object,
    updateFile: rootPackageFileInfo.updateFile,
  }
  workspacePackages[rootPackageFileInfo.object.name] = rootPackage

  const patterns = {}
  const { workspaces = [] } = rootPackage.packageObject
  workspaces.forEach((workspace) => {
    const workspaceUrl = new URL(workspace, rootPackageUrl).href
    const workspaceRelativeUrl = urlToRelativeUrl(workspaceUrl, rootPackageUrl)
    const pattern = `${workspaceRelativeUrl}/package.json`
    patterns[pattern] = true
  })

  const packageDirectoryUrls = await listFilesMatching({
    directoryUrl,
    patterns,
  })

  await Promise.all(
    packageDirectoryUrls.map(async (packageDirectoryUrl) => {
      const packageUrl = new URL("package.json", packageDirectoryUrl)
      const packageFileInfo = await readPackageFile(packageUrl)
      workspacePackages[packageFileInfo.object.name] = {
        packageUrl,
        packageObject: packageFileInfo.object,
        updateFile: packageFileInfo.updateFile,
      }
    }),
  )
  return workspacePackages
}

const readPackageFile = async (url) => {
  const fileContent = await readFile(url, { as: "string" })
  const hasFinalNewLine = fileContent[fileContent.length - 1] === "\n"
  return {
    object: JSON.parse(fileContent),
    updateFile: async (data) => {
      let dataAsJson = JSON.stringify(data, null, "  ")
      if (hasFinalNewLine) {
        dataAsJson += "\n"
      }
      await writeFile(url, dataAsJson)
    },
  }
}
