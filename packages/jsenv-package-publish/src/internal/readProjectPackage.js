import { resolveUrl, urlToFileSystemPath } from "@jsenv/urls"
import { readFile } from "@jsenv/filesystem"

export const readProjectPackage = async ({ rootDirectoryUrl }) => {
  const packageFileUrl = resolveUrl("./package.json", rootDirectoryUrl)
  let packageObject
  try {
    const packageString = await readFile(packageFileUrl, { as: "string" })
    try {
      packageObject = JSON.parse(packageString)
    } catch (e) {
      if (e.name === "SyntaxError") {
        throw new Error(`syntax error while parsing project package.json
--- syntax error stack ---
${e.stack}
--- package.json path ---
${urlToFileSystemPath(packageFileUrl)}`)
      }
      throw e
    }
  } catch (e) {
    if (e.code === "ENOENT") {
      throw new Error(
        `cannot find project package.json
--- package.json path ---
${urlToFileSystemPath(packageFileUrl)}`,
      )
    }
    throw e
  }
  return packageObject
}
