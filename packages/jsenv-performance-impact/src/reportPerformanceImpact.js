import { resolveUrl, assertAndNormalizeDirectoryUrl } from "@jsenv/filesystem"
import { commentGitHubPullRequestImpact } from "@jsenv/github-pull-request-impact"
import { importOneExportFromFile } from "@jsenv/dynamic-import-worker"

import { assertPerformanceReport } from "./internal/assertions.js"
import { createPerfImpactComment } from "./internal/comment/createPerfImpactComment.js"
import { jsenvCommentParameters } from "./internal/comment/jsenvCommentParameters.js"

export const reportPerformanceImpact = async ({
  logLevel,
  commandLogs,
  cancelOnSIGINT,
  rootDirectoryUrl,

  githubToken,
  repositoryOwner,
  repositoryName,
  pullRequestNumber,

  installCommand = "npm install",
  performanceReportPath,
  isPerformanceImpactBig = jsenvCommentParameters.isPerformanceImpactBig,
  formatGroupSummary = jsenvCommentParameters.formatGroupSummary,
  formatPerformanceImpactCell = jsenvCommentParameters.formatPerformanceImpactCell,

  runLink,
  commitInGeneratedByInfo,
}) => {
  rootDirectoryUrl = assertAndNormalizeDirectoryUrl(rootDirectoryUrl)
  if (typeof performanceReportPath !== "string") {
    throw new TypeError(
      `performanceReportPath must be a string but received ${performanceReportPath}`,
    )
  }
  rootDirectoryUrl = assertAndNormalizeDirectoryUrl(rootDirectoryUrl)
  const performanceReportUrl = resolveUrl(
    performanceReportPath,
    rootDirectoryUrl,
  )

  return commentGitHubPullRequestImpact({
    logLevel,
    commandLogs,
    cancelOnSIGINT,
    rootDirectoryUrl,

    githubToken,
    repositoryOwner,
    repositoryName,
    pullRequestNumber,

    collectInfo: async ({ execCommandInRootDirectory }) => {
      await execCommandInRootDirectory(installCommand)
      const performanceReport = await importOneExportFromFile(
        performanceReportUrl,
      )
      assertPerformanceReport(performanceReport)
      return { version: 1, data: performanceReport }
    },
    commentIdentifier: `<!-- Generated by @jsenv/performance-impact -->`,
    createCommentForComparison: ({
      pullRequestBase,
      pullRequestHead,
      beforeMergeData,
      afterMergeData,
    }) => {
      return createPerfImpactComment({
        pullRequestBase,
        pullRequestHead,
        beforeMergeData,
        afterMergeData,
        isPerformanceImpactBig,
        formatGroupSummary,
        formatPerformanceImpactCell,
      })
    },
    generatedByLink: {
      url: "https://github.com/jsenv/workflow/tree/main/packages/jsenv-performance-impact",
      text: "@jsenv/performance-impact",
    },
    runLink,
    commitInGeneratedByInfo,
  })
}
