/* eslint-disable new-cap */
import { createDetailedMessage } from "@jsenv/logger"
import {
  GET,
  POST,
  PATCH,
} from "@jsenv/github-pull-request-impact/src/internal/git_hub_api.js"

// https://developer.github.com/v3/gists/#create-a-gist

export const patchOrPostGists = async ({
  logger,

  githubToken,
  repositoryOwner,
  repositoryName,
  pullRequestNumber,

  beforeMergeLighthouseReport,
  afterMergeLighthouseReport,
  existingComment,
}) => {
  let beforeMergeGistId
  let afterMergeGistId

  if (existingComment) {
    const gistIds = gistIdsFromComment(existingComment)
    if (gistIds) {
      beforeMergeGistId = gistIds.beforeMergeGistId
      afterMergeGistId = gistIds.afterMergeGistId
      logger.debug(
        createDetailedMessage(`gists found in comment body`, {
          "before merging gist with lighthouse report":
            gistIdToUrl(beforeMergeGistId),
          "after merging gist with lighthouse report":
            gistIdToUrl(afterMergeGistId),
        }),
      )
    } else {
      logger.debug(`cannot find gist id in comment body`)
    }
  }

  logger.debug(`update or create both gists.`)
  let [beforeMergeGist, afterMergeGist] = await Promise.all([
    beforeMergeGistId
      ? GET(`https://api.github.com/gists/${beforeMergeGistId}`, {
          githubToken,
        })
      : null,
    afterMergeGistId
      ? GET(`https://api.github.com/gists/${afterMergeGistId}`, {
          githubToken,
        })
      : null,
  ])

  const beforeMergeGistBody = createGistBody(beforeMergeLighthouseReport, {
    repositoryOwner,
    repositoryName,
    pullRequestNumber,
    beforeMerge: true,
  })
  if (beforeMergeGist) {
    logger.info(`updating base gist at ${gistIdToUrl(beforeMergeGist.id)}`)
    beforeMergeGist = await PATCH(
      `https://api.github.com/gists/${beforeMergeGist.id}`,
      beforeMergeGistBody,
      {
        githubToken,
      },
    )
    logger.info(`base gist updated`)
  } else {
    logger.info(`creating base gist`)
    beforeMergeGist = await POST(
      `https://api.github.com/gists`,
      beforeMergeGistBody,
      {
        githubToken,
      },
    )
    logger.info(`base gist created at ${gistIdToUrl(beforeMergeGist.id)}`)
  }

  const afterMergeGistBody = createGistBody(afterMergeLighthouseReport, {
    repositoryOwner,
    repositoryName,
    pullRequestNumber,
    beforeMerge: false,
  })
  if (afterMergeGist) {
    logger.info(
      `updating after merge gist at ${gistIdToUrl(afterMergeGist.id)}`,
    )
    afterMergeGist = await PATCH(
      `https://api.github.com/gists/${afterMergeGist.id}`,
      afterMergeGistBody,
      {
        githubToken,
      },
    )
    logger.info(`after merge gist updated`)
  } else {
    logger.info(`creating after merge gist`)
    afterMergeGist = await POST(
      `https://api.github.com/gists`,
      afterMergeGistBody,
      {
        githubToken,
      },
    )
    logger.info(`after merge gist created at ${gistIdToUrl(afterMergeGist.id)}`)
  }

  return {
    beforeMergeGist,
    afterMergeGist,
  }
}

const createGistBody = (
  lighthouseReport,
  { repositoryOwner, repositoryName, pullRequestNumber, beforeMerge },
) => {
  return {
    files: {
      [`${repositoryOwner}_${repositoryName}_pr_${pullRequestNumber}_${
        beforeMerge ? "before_merge" : "after_merge"
      }_lighthouse_report.json`]: {
        content: JSON.stringify(lighthouseReport, null, "  "),
      },
    },
    public: false,
  }
}

const beforeMergeGistIdRegex = new RegExp(
  "<!-- before_merge_gist_id=([a-zA-Z0-9_]+) -->",
)
const afterMergeGistIdRegex = new RegExp(
  "<!-- after_merge_gist_id=([a-zA-Z0-9_]+) -->",
)

const gistIdsFromComment = (comment) => {
  const beforeMergeGistIdMatch = comment.body.match(beforeMergeGistIdRegex)
  if (!beforeMergeGistIdMatch) {
    return null
  }

  const afterMergeGistIdMatch = comment.body.match(afterMergeGistIdRegex)
  if (!afterMergeGistIdMatch) {
    return null
  }

  const beforeMergeGistId = beforeMergeGistIdMatch[1]
  const afterMergeGistId = afterMergeGistIdMatch[1]
  return {
    beforeMergeGistId,
    afterMergeGistId,
  }
}

const gistIdToUrl = (gistId) => {
  return `https://gist.github.com/${gistId}`
}
