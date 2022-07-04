import { fileURLToPath } from "node:url"
import { readFileSync, writeFileSync } from "node:fs"
import { exec } from "node:child_process"
import { removeEntry } from "@jsenv/filesystem"
import { UNICODE } from "@jsenv/log"

import { setNpmConfig } from "./setNpmConfig.js"

export const publish = async ({
  logger,
  packageSlug,
  logNpmPublishOutput,
  rootDirectoryUrl,
  registryUrl,
  token,
}) => {
  const getResult = async () => {
    try {
      // process.env.NODE_AUTH_TOKEN
      const previousValue = process.env.NODE_AUTH_TOKEN
      const restoreProcessEnv = () => {
        process.env.NODE_AUTH_TOKEN = previousValue
      }
      process.env.NODE_AUTH_TOKEN = token
      // updating package.json to publish on the correct registry
      let restorePackageFile = () => {}
      const rootPackageFileUrl = new URL("./package.json", rootDirectoryUrl)
      const rootPackageFileContent = readFileSync(rootPackageFileUrl)
      const { publishConfig } = packageObject
      const packageObject = JSON.parse(String(rootPackageFileContent))
      const registerUrlFromPackage = publishConfig
        ? publishConfig.registry || "https://registry.npmjs.org"
        : "https://registry.npmjs.org"
      if (registryUrl !== registerUrlFromPackage) {
        restorePackageFile = () =>
          writeFileSync(rootPackageFileUrl, rootPackageFileContent)
        packageObject.publishConfig = packageObject.publishConfig || {}
        packageObject.publishConfig.registry = registryUrl
        writeFileSync(
          rootPackageFileUrl,
          JSON.stringify(packageObject, null, "  "),
        )
      }
      // updating .npmrc to add the token
      const npmConfigFileUrl = new URL("./.npmrc", rootDirectoryUrl)
      let restoreNpmConfigFile
      let npmConfigFileContent
      try {
        npmConfigFileContent = String(readFileSync(npmConfigFileUrl))
        restoreNpmConfigFile = () =>
          writeFileSync(npmConfigFileUrl, npmConfigFileContent)
      } catch (e) {
        if (e.code === "ENOENT") {
          restoreNpmConfigFile = () => removeEntry(npmConfigFileUrl)
          npmConfigFileContent = ""
        } else {
          throw e
        }
      }
      writeFileSync(
        npmConfigFileUrl,
        setNpmConfig(npmConfigFileContent, {
          [computeRegistryTokenKey(registryUrl)]: token,
          [computeRegistryKey(packageObject.name)]: registryUrl,
        }),
      )
      try {
        return await new Promise((resolve, reject) => {
          const command = exec(
            "npm publish --no-workspaces",
            {
              cwd: fileURLToPath(rootDirectoryUrl),
              stdio: "silent",
            },
            (error) => {
              if (error) {
                // publish conflict generally occurs because servers
                // returns 200 after npm publish
                // but returns previous version if asked immediatly
                // after for the last published version.

                // TODO: ideally we should catch 404 error returned from npm
                // it happens it the token is not allowed to publish
                // a repository. And when we detect this we display a more useful message
                // suggesting the token rights are insufficient to publish the package

                // npm publish conclit
                if (error.message.includes("EPUBLISHCONFLICT")) {
                  resolve({
                    success: true,
                    reason: "already-published",
                  })
                } else if (
                  error.message.includes("Cannot publish over existing version")
                ) {
                  resolve({
                    success: true,
                    reason: "already-published",
                  })
                } else if (
                  error.message.includes(
                    "You cannot publish over the previously published versions",
                  )
                ) {
                  resolve({
                    success: true,
                    reason: "already-published",
                  })
                }
                // github publish conflict
                else if (
                  error.message.includes(
                    "ambiguous package version in package.json",
                  )
                ) {
                  resolve({
                    success: true,
                    reason: "already-published",
                  })
                } else {
                  reject(error)
                }
              } else {
                resolve({
                  success: true,
                  reason: "published",
                })
              }
            },
          )
          if (logNpmPublishOutput) {
            command.stdout.on("data", (data) => {
              logger.debug(data)
            })
            command.stderr.on("data", (data) => {
              // debug because this output is part of
              // the error message generated by a failing npm publish
              logger.debug(data)
            })
          }
        })
      } finally {
        restoreProcessEnv()
        restorePackageFile()
        restoreNpmConfigFile()
      }
    } catch (e) {
      return {
        success: false,
        reason: e,
      }
    }
  }
  const { success, reason } = await getResult()
  if (success) {
    if (reason === "already-published") {
      logger.info(
        `${UNICODE.INFO} ${packageSlug} was already published on ${registryUrl}`,
      )
    } else {
      logger.info(`${UNICODE.OK} ${packageSlug} published on ${registryUrl}`)
    }
  } else {
    logger.error(`${UNICODE.FAILURE} error when publishing ${packageSlug} in ${registryUrl}
  --- error stack ---
  ${reason.stack}`)
  }
  return { success, reason }
}

const computeRegistryTokenKey = (registryUrl) => {
  if (registryUrl.startsWith("http://")) {
    return `${registryUrl.slice("http:".length)}/:_authToken`
  }
  if (registryUrl.startsWith("https://")) {
    return `${registryUrl.slice("https:".length)}/:_authToken`
  }
  if (registryUrl.startsWith("//")) {
    return `${registryUrl}/:_authToken`
  }
  throw new Error(
    `registryUrl must start with http or https, got ${registryUrl}`,
  )
}

const computeRegistryKey = (packageName) => {
  if (packageName[0] === "@") {
    const packageScope = packageName.slice(0, packageName.indexOf("/"))
    return `${packageScope}:registry`
  }
  return `registry`
}
