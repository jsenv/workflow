// https://developer.github.com/v3/git/tags/

import { fetchUrl } from "@jsenv/server"

export const createGithubRelease = async ({
  githubToken,
  githubRepositoryOwner,
  githubRepositoryName,
  githubSha,
  githubReleaseName,
}) => {
  const requestUrl = `https://api.github.com/repos/${githubRepositoryOwner}/${githubRepositoryName}/git/refs`
  const body = JSON.stringify({
    ref: `refs/tags/${githubReleaseName}`,
    sha: githubSha,
  })
  const response = await fetchUrl(requestUrl, {
    headers: {
      "authorization": `token ${githubToken}`,
      "content-length": Buffer.byteLength(body),
    },
    method: "POST",
    body,
  })
  const responseStatus = response.status
  if (responseStatus !== 201) {
    throw new Error(
      writeUnexpectedResponseStatus({
        requestUrl,
        responseStatus,
        responseText: await response.text(),
      }),
    )
  }
  const responseJson = await response.json()
  return responseJson
}

const writeUnexpectedResponseStatus = ({
  requestUrl,
  responseStatus,
  responseText,
}) => `github api response status should be 201.
--- request url ----
${requestUrl}
--- response status ---
${responseStatus}
--- response text ---
${responseText}`
