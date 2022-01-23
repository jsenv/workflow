// https://developer.github.com/v3/git/refs/#get-a-single-reference

import { fetchUrl } from "@jsenv/server"

export const getGithubRelease = async ({
  githubToken,
  githubRepositoryOwner,
  githubRepositoryName,
  githubReleaseName,
}) => {
  const requestUrl = `https://api.github.com/repos/${githubRepositoryOwner}/${githubRepositoryName}/git/ref/tags/${githubReleaseName}`
  const response = await fetchUrl(requestUrl, {
    headers: {
      authorization: `token ${githubToken}`,
    },
    method: "GET",
  })
  const responseStatus = response.status
  if (responseStatus === 404) {
    return null
  }
  if (responseStatus !== 200) {
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
}) => `github api response status should be 200.
--- request url ----
${requestUrl}
--- response status ---
${responseStatus}
--- response text ---
${responseText}`
