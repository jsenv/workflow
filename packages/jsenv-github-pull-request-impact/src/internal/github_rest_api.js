import nodeFetch from "node-fetch"

export const GET = async ({ url, githubToken, headers }) => {
  return sendHttpRequest({
    url,
    method: "GET",
    headers: {
      ...tokenToHeaders(githubToken),
      headers,
    },
    responseStatusHandlers: {
      200: async (response) => {
        const json = await response.json()
        return json
      },
      404: () => null,
    },
  })
}

export const POST = ({ url, body, githubToken, headers }) => {
  return sendHttpRequest({
    url,
    method: "POST",
    headers: {
      ...tokenToHeaders(githubToken),
      headers,
    },
    body: JSON.stringify(body),
    responseStatusHandlers: {
      201: async (response) => {
        const json = await response.json()
        return json
      },
    },
  })
}

export const PATCH = async ({ url, body, githubToken, headers }) => {
  return sendHttpRequest({
    url,
    method: "PATCH",
    headers: {
      ...tokenToHeaders(githubToken),
      headers,
    },
    body: JSON.stringify(body),
    responseStatusHandlers: {
      200: async (response) => {
        const json = await response.json()
        return json
      },
    },
  })
}

export const tokenAsAuthorizationHeaderValue = (token) => {
  return `token ${Buffer.from(token).toString("base64")}`
}

const tokenToHeaders = (token) => {
  if (!token) {
    throw new Error(`missing token, request will not be authorized.`)
  }
  return {
    authorization: tokenAsAuthorizationHeaderValue(token),
  }
}

const sendHttpRequest = async ({
  url,
  method,
  headers,
  body,
  responseStatusHandlers = {},
}) => {
  let response
  try {
    response = await nodeFetch(url, {
      method,
      headers: {
        ...(typeof body === "undefined"
          ? {}
          : { "content-length": Buffer.byteLength(body) }),
        ...headers,
      },
      body,
    })
  } catch (error) {
    throw new Error(`network error during request.
--- request method ---
${method}
--- request url ---
${url}
--- error stack ---
${error.stack}`)
  }

  const { status } = response
  const responseStatusHandler = responseStatusHandlers[status]
  if (responseStatusHandler) {
    return responseStatusHandler(response)
  }
  const responseBodyAsJson = await response.json()
  const error = new Error(`unexpected response status.
--- response status ---
${response.status}
--- expected response status ---
${Object.keys(responseStatusHandlers).join(", ")}
--- request method ---
${method}
--- request url ---
${url}
--- response json ---
${(JSON.stringify(responseBodyAsJson), null, "  ")}`)
  error.responseStatus = status
  throw error
}
