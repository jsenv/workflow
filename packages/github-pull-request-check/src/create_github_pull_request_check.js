/**
 *
 * https://github.com/IgnusG/jest-report-action/blob/c006b890ba3c3b650e6c55916a643ca82b64133b/tasks/github-api.js#L12
 */

import { createLogger } from "@jsenv/log";

import { GET, POST, PATCH } from "./internal/github_rest_api.js";

// createGithubPullRequestCheck({
//   checkName: "jsenv tests",
//   checkSummary: "All tests executed in ",
//   checkAnnotations: [],
//   checkConclusion: "",
// });

/*
annotation object contains the following:
{path: filePath,
title: `${ describe } > ${ test }`,
start_line: location.start.line,
end_line: location.end.line,
annotation_level: 'failure',
message: `${ title }\n${ expectations }\n\n${ stacktrace }`
*/

// https://docs.github.com/fr/rest/checks/runs?apiVersion=2022-11-28#create-a-check-run
export const startGithubPullRequestCheck = async ({
  logLevel,
  githubToken,
  repositoryOwner,
  repositoryName,
  pullRequestNumber,
  checkStatus = "in_progress",
  checkName,
  checkTitle,
  checkSummary,
}) => {
  if (typeof githubToken !== "string") {
    throw new TypeError(
      `githubToken must be a string but received ${githubToken}`,
    );
  }
  if (typeof repositoryOwner !== "string") {
    throw new TypeError(
      `repositoryOwner must be a string but received ${repositoryOwner}`,
    );
  }
  if (typeof repositoryName !== "string") {
    throw new TypeError(
      `repositoryName must be a string but received ${repositoryName}`,
    );
  }
  pullRequestNumber = String(pullRequestNumber);
  if (typeof pullRequestNumber !== "string") {
    throw new TypeError(
      `pullRequestNumber must be a string but received ${pullRequestNumber}`,
    );
  }
  if (typeof checkName !== "string") {
    throw new TypeError(`checkName must be a string but received ${checkName}`);
  }

  const logger = createLogger({ logLevel });

  const pullApiUrl = `https://api.github.com/repos/${repositoryOwner}/${repositoryName}/pulls/${pullRequestNumber}`;
  // https://developer.github.com/v3/pulls/#get-a-pull-request
  logger.debug(`get pull request ${pullApiUrl}`);
  const pullRequest = await GET({
    url: pullApiUrl,
    githubToken,
  });
  const pullRequestHeadSha = pullRequest.head.sha;

  await POST({
    url: `/repos/${repositoryOwner}/${repositoryName}/check-runs`,
    githubToken,
    body: {
      head_sha: pullRequestHeadSha,
      status: checkStatus,
      name: checkName,
      output: {
        title: checkTitle,
        summary: checkSummary,
      },
    },
  });

  const update = async ({
    status,
    conclusion,
    title,
    summary,
    annotations = [],
  }) => {
    let annotationsSent = 0;
    const annotationsBatch = annotations.slice(annotationsSent, 50);
    await PATCH({
      url: `/repos/${repositoryOwner}/${repositoryName}/check-runs`,
      githubToken,
      body: {
        head_sha: pullRequestHeadSha,
        ...(status ? { status } : {}),
        ...(conclusion ? { conclusion } : {}),
        output: {
          ...(title ? { title } : {}),
          ...(summary ? { summary } : {}),
          annotations: annotationsBatch,
        },
      },
    });
    if (status) {
      checkStatus = status;
    }
    if (title) {
      checkTitle = title;
    }
    if (summary) {
      checkSummary = summary;
    }

    annotationsSent += annotationsBatch.length;
    while (annotationsSent < annotations.length) {
      const annotationsBatch = annotations.slice(annotationsSent, 50);
      await PATCH({
        url: `/repos/${repositoryOwner}/${repositoryName}/check-runs`,
        githubToken,
        body: {
          head_sha: pullRequestHeadSha,
          output: {
            annotations: annotationsBatch,
          },
        },
      });
      annotationsSent += annotationsBatch.length;
    }
  };

  return {
    progress: ({ title, summary, annotations }) => {
      return update({
        title,
        summary,
        annotations,
      });
    },
    success: ({ title, summary, annotations }) => {
      return update({
        status: "completed",
        conclusion: "success",
        title,
        summary,
        annotations,
      });
    },
    failure: ({ title, summary, annotations }) => {
      return update({
        status: "completed",
        conclusion: "failure",
        title,
        summary,
        annotations,
      });
    },
  };
};
