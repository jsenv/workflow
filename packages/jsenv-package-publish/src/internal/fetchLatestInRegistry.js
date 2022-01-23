// https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md#getpackageversion
// https://github.com/npm/registry-issue-archive/issues/34
// https://stackoverflow.com/questions/53212849/querying-information-about-specific-version-of-scoped-npm-package

import { fetchUrl } from "@jsenv/server"

export const fetchLatestInRegistry = async ({
  registryUrl,
  packageName,
  token,
}) => {
  const requestUrl = `${registryUrl}/${packageName}`
  const response = await fetchUrl(requestUrl, {
    method: "GET",
    headers: {
      // "user-agent": "jsenv",
      accept:
        "application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*",
      ...(token
        ? {
            authorization: tokenAsAuthorizationHeaderValue(token),
          }
        : {}),
    },
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
  const packageObject = await response.json()
  return packageObject.versions[packageObject["dist-tags"].latest]
}

const tokenAsAuthorizationHeaderValue = (token) => {
  return `token ${Buffer.from(token).toString("base64")}`
}

const writeUnexpectedResponseStatus = ({
  requestUrl,
  responseStatus,
  responseText,
}) => `package registry response status should be 200.
--- request url ----
${requestUrl}
--- response status ---
${responseStatus}
--- response text ---
${responseText}`
