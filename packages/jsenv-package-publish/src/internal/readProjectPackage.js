import { fileURLToPath } from "node:url"
import { readFile } from "@jsenv/filesystem"

export const readProjectPackage = async ({ rootDirectoryUrl }) => {
  const packageFileUrl = new URL("./package.json", rootDirectoryUrl).href
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
${fileURLToPath(packageFileUrl)}`)
      }
      throw e
    }
  } catch (e) {
    if (e.code === "ENOENT") {
      throw new Error(
        `cannot find project package.json
--- package.json path ---
${fileURLToPath(packageFileUrl)}`,
      )
    }
    throw e
  }
  return packageObject
}
