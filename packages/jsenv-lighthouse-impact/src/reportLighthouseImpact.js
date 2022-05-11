import { assertAndNormalizeDirectoryUrl, resolveUrl } from "@jsenv/filesystem"
import { commentGitHubPullRequestImpact } from "@jsenv/github-pull-request-impact"
import { importOneExportFromFile } from "@jsenv/dynamic-import-worker"

import { patchOrPostGists } from "./internal/patchOrPostGists.js"
import { createLighthouseImpactComment } from "./internal/createLighthouseImpactComment.js"

export const reportLighthouseImpact = async ({
  logLevel,
  commandLogs = false,
  cancelOnSIGINT,
  rootDirectoryUrl,

  githubToken,
  repositoryOwner,
  repositoryName,
  pullRequestNumber,
  installCommand = "npm install",
  lighthouseReportPath,

  runLink,
  commitInGeneratedByInfo,
  catchError,
  skipGistWarning = false,
}) => {
  rootDirectoryUrl = assertAndNormalizeDirectoryUrl(rootDirectoryUrl)
  if (typeof lighthouseReportPath !== "string") {
    throw new TypeError(
      `lighthouseReportPath must be a string but received ${lighthouseReportPath}`,
    )
  }
  rootDirectoryUrl = assertAndNormalizeDirectoryUrl(rootDirectoryUrl)
  const lighthouseReportUrl = resolveUrl(lighthouseReportPath, rootDirectoryUrl)

  return commentGitHubPullRequestImpact({
    logLevel,
    commandLogs,
    // lighthouse report are super verbose, do not log them
    infoLogs: false,
    cancelOnSIGINT,
    rootDirectoryUrl,

    githubToken,
    repositoryOwner,
    repositoryName,
    pullRequestNumber,

    collectInfo: async ({ execCommandInRootDirectory }) => {
      await execCommandInRootDirectory(installCommand)
      const lighthouseReport = await importOneExportFromFile(
        lighthouseReportUrl,
      )
      return { version: 1, data: lighthouseReport }
    },
    commentIdentifier: `<!-- Generated by @jsenv/lighthouse-impact -->`,
    createCommentForComparison: async ({
      logger,

      pullRequestBase,
      pullRequestHead,
      beforeMergeData,
      afterMergeData,
      existingComment,
    }) => {
      const gistWarnings = []

      let beforeMergeGist
      let afterMergeGist
      try {
        const gistResult = await patchOrPostGists({
          logger,

          githubToken,
          repositoryOwner,
          repositoryName,
          pullRequestNumber,

          beforeMergeLighthouseReport: beforeMergeData,
          afterMergeLighthouseReport: afterMergeData,
          existingComment,
        })
        beforeMergeGist = gistResult.beforeMergeGist
        afterMergeGist = gistResult.afterMergeGist
      } catch (e) {
        if (e.responseStatus === 403) {
          if (!skipGistWarning) {
            gistWarnings.push(
              `**Warning:** Link to lighthouse reports cannot be generated because github token is not allowed to create gists.`,
            )
          }
        } else {
          throw e
        }
      }

      const comment = createLighthouseImpactComment({
        pullRequestBase,
        pullRequestHead,
        beforeMergeLighthouseReport: beforeMergeData,
        afterMergeLighthouseReport: afterMergeData,
        beforeMergeGist,
        afterMergeGist,
      })

      return {
        warnings: [...gistWarnings, ...comment.warnings],
        body: comment.body,
      }
    },
    generatedByLink: {
      url: "https://github.com/jsenv/workflow/tree/main/packages/jsenv-lighthouse-impact",
      text: "@jsenv/lighthouse-impact",
    },
    runLink,
    commitInGeneratedByInfo,
    catchError,
  })
}
