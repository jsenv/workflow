/**
 *
 * https://github.com/IgnusG/jest-report-action/blob/c006b890ba3c3b650e6c55916a643ca82b64133b/tasks/github-api.js#L12
 */

import { createLogger, UNICODE, createDetailedMessage } from "@jsenv/log";

import { POST, PATCH } from "./internal/github_rest_api.js";

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
export const startGithubCheckRun = async ({
  logLevel,
  githubToken,
  repositoryOwner,
  repositoryName,
  commitSha,
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
  if (typeof commitSha !== "string") {
    throw new TypeError(`commitSha must be a string but received ${commitSha}`);
  }
  if (typeof checkName !== "string") {
    throw new TypeError(`checkName must be a string but received ${checkName}`);
  }

  const logger = createLogger({ logLevel });

  logger.debug(`create check for commit ${commitSha}`);
  let check;
  try {
    check = await POST({
      url: `https://api.github.com/repos/${repositoryOwner}/${repositoryName}/check-runs`,
      githubToken,
      headers: {
        "accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: {
        head_sha: commitSha,
        status: checkStatus,
        name: checkName,
        output: {
          title: checkTitle,
          summary: checkSummary,
        },
      },
    });
    logger.debug(`${UNICODE.OK} check created (id: ${check.id})`);
  } catch (e) {
    logger.error(
      createDetailedMessage(`${UNICODE.FAILURE} failed to create check`, {
        "error stack": e.stack,
      }),
    );
    return { progress: () => {}, fail: () => {}, pass: () => {} };
  }

  let previousUpdatePromise;
  const update = async ({
    status,
    conclusion,
    title,
    summary,
    annotations = [],
  }) => {
    if (previousUpdatePromise) {
      await previousUpdatePromise;
    }
    previousUpdatePromise = (async () => {
      let annotationsSent = 0;
      const annotationsBatch = annotations.slice(annotationsSent, 50);
      await PATCH({
        url: `https://api.github.com/repos/${repositoryOwner}/${repositoryName}/check-runs`,
        githubToken,
        body: {
          head_sha: commitSha,
          check_run_id: check.id,
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
          url: `https://api.github.com/repos/${repositoryOwner}/${repositoryName}/check-runs`,
          githubToken,
          body: {
            head_sha: commitSha,
            check_run_id: check.id,
            output: {
              annotations: annotationsBatch,
            },
          },
        });
        annotationsSent += annotationsBatch.length;
      }

      previousUpdatePromise = null;
    })();
    return previousUpdatePromise;
  };

  let lastProgressCall;
  let pendingAnnotations = [];
  let pendingAbortController;
  let msBetweenProgressCalls = 500;

  return {
    progress: async ({ title, summary, annotations = [] }) => {
      const nowMs = Date.now();
      const isFirstCall = !lastProgressCall;
      lastProgressCall = nowMs;
      if (isFirstCall) {
        await update({
          title,
          summary,
          annotations,
        });
        return;
      }
      if (pendingAbortController) {
        pendingAbortController.abort();
      }
      const msEllapsedSinceLastProgressCall = nowMs - lastProgressCall;
      const msEllapsedIsBigEnough =
        msEllapsedSinceLastProgressCall > msBetweenProgressCalls;
      if (msEllapsedIsBigEnough) {
        annotations = [...pendingAnnotations, ...annotations];
        pendingAnnotations.length = 0;
        await update({
          title,
          summary,
          annotations,
        });
        return;
      }
      pendingAnnotations.push(...annotations);
      pendingAbortController = new AbortController();
      await new Promise((resolve) => {
        pendingAbortController.signal.onabort = resolve;
        setTimeout(resolve, msBetweenProgressCalls);
      });
      if (pendingAbortController.signal.aborted) {
        return;
      }
      pendingAbortController = null;
      await update({
        title,
        summary,
        annotations,
      });
    },
    fail: ({ title, summary, annotations } = {}) => {
      return update({
        status: "completed",
        conclusion: "failure",
        title,
        summary,
        annotations,
      });
    },
    pass: ({ title, summary, annotations } = {}) => {
      return update({
        status: "completed",
        conclusion: "success",
        title,
        summary,
        annotations,
      });
    },
  };
};
