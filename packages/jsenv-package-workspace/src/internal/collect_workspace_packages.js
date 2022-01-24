import { readFile, listFilesMatching, writeFile } from "@jsenv/filesystem"

export const collectWorkspacePackages = async ({ directoryUrl }) => {
  const workspacePackages = {}
  const packageDirectoryUrls = await listFilesMatching({
    directoryUrl,
    patterns: {
      "./packages/*/package.json": true,
    },
  })
  const rootPackageUrl = new URL("package.json", directoryUrl)
  const rootPackageFileInfo = await readPackageFile(rootPackageUrl)
  workspacePackages[rootPackageFileInfo.object.name] = {
    isRoot: true,
    packageUrl: rootPackageUrl,
    packageObject: rootPackageFileInfo.object,
    updateFile: rootPackageFileInfo.updateFile,
  }
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
  const fileContent = await readFile(url)
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
