import { assertAndNormalizeDirectoryUrl } from "@jsenv/filesystem"
import { createLogger } from "@jsenv/logger"

import { readProjectPackage } from "./internal/readProjectPackage.js"
import { getGithubRelease } from "./internal/getGithubRelease.js"
import { createGithubRelease } from "./internal/createGithubRelease.js"

export const ensureGithubReleaseForPackage = async ({
  logLevel,
  projectDirectoryUrl,
}) => {
  const logger = createLogger({ logLevel })
  logger.debug(
    `autoReleaseOnGithub(${JSON.stringify(
      { projectDirectoryUrl, logLevel },
      null,
      "  ",
    )})`,
  )

  projectDirectoryUrl = assertAndNormalizeDirectoryUrl(projectDirectoryUrl)

  const {
    githubToken,
    githubRepositoryOwner,
    githubRepositoryName,
    githubSha,
  } = getOptionsFromGithubAction()

  logger.debug(`reading project package.json`)
  const { packageVersion } = await getOptionsFromProjectPackage({
    projectDirectoryUrl,
  })
  logger.debug(`${packageVersion} found in package.json`)

  logger.debug(`search release for ${packageVersion} on github`)
  const githubReleaseName = `v${packageVersion}`
  const existingRelease = await getGithubRelease({
    githubToken,
    githubRepositoryOwner,
    githubRepositoryName,
    githubReleaseName,
  })
  if (existingRelease) {
    logger.info(
      `${packageVersion} already released at ${generateReleaseUrl({
        githubRepositoryOwner,
        githubRepositoryName,
        githubReleaseName,
      })}`,
    )
    return
  }

  logger.info(`creating release for ${packageVersion}`)
  await createGithubRelease({
    githubToken,
    githubRepositoryOwner,
    githubRepositoryName,
    githubSha,
    githubReleaseName,
  })
  logger.info(
    `release created at ${generateReleaseUrl({
      githubRepositoryOwner,
      githubRepositoryName,
      githubReleaseName,
    })}`,
  )
}

const generateReleaseUrl = ({
  githubRepositoryOwner,
  githubRepositoryName,
  githubReleaseName,
}) => {
  return `https://github.com/${githubRepositoryOwner}/${githubRepositoryName}/releases/tag/${githubReleaseName}`
}

const getOptionsFromGithubAction = () => {
  const eventName = process.env.GITHUB_EVENT_NAME
  if (!eventName) {
    throw new Error(
      `missing process.env.GITHUB_EVENT_NAME, we are not in a github action`,
    )
  }
  if (eventName !== "push") {
    throw new Error(
      `getOptionsFromGithubAction must be called only in a push action`,
    )
  }
  const githubRepository = process.env.GITHUB_REPOSITORY
  if (!githubRepository) {
    throw new Error(`missing process.env.GITHUB_REPOSITORY`)
  }
  const [githubRepositoryOwner, githubRepositoryName] =
    githubRepository.split("/")
  const githubToken = process.env.GITHUB_TOKEN
  if (!githubToken) {
    throw new Error(`missing process.env.GITHUB_TOKEN`)
  }
  const githubSha = process.env.GITHUB_SHA
  if (!githubSha) {
    throw new Error(`missing process.env.GITHUB_SHA`)
  }
  return {
    githubRepositoryOwner,
    githubRepositoryName,
    githubToken,
    githubSha,
  }
}

const getOptionsFromProjectPackage = async ({ projectDirectoryUrl }) => {
  const projectPackage = await readProjectPackage({ projectDirectoryUrl })
  return {
    packageVersion: projectPackage.version,
  }
}
