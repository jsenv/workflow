import { fetchUrl } from "@jsenv/server"

export const GET = async (url, { githubToken } = {}) => {
  return sendHttpRequest(url, {
    method: "GET",
    headers: tokenToHeaders(githubToken),
    responseStatusMap: {
      200: async (response) => {
        const json = await response.json()
        return json
      },
      404: () => null,
    },
  })
}

export const POST = (url, body, { githubToken } = {}) => {
  return sendHttpRequest(url, {
    method: "POST",
    headers: tokenToHeaders(githubToken),
    body: JSON.stringify(body),
    responseStatusMap: {
      201: async (response) => {
        const json = await response.json()
        return json
      },
    },
  })
}

export const PATCH = async (url, body, { githubToken } = {}) => {
  return sendHttpRequest(url, {
    method: "PATCH",
    headers: tokenToHeaders(githubToken),
    body: JSON.stringify(body),
    responseStatusMap: {
      200: async (response) => {
        const json = await response.json()
        return json
      },
    },
  })
}

const tokenToHeaders = (token) => {
  if (!token) {
    throw new Error(`missing token, request will not be authorized.`)
  }
  return {
    authorization: `token ${token}`,
  }
}

const sendHttpRequest = async (
  url,
  { method, headers, body, responseStatusMap },
) => {
  let response
  try {
    response = await fetchUrl(url, {
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
  if (status in responseStatusMap) {
    return responseStatusMap[response.status](response)
  }

  const responseBodyAsJson = await response.json()
  const error = new Error(`unexpected response status.
--- response status ---
${response.status}
--- expected response status ---
${Object.keys(responseStatusMap).join(", ")}
--- request method ---
${method}
--- request url ---
${url}
--- response json ---
${(JSON.stringify(responseBodyAsJson), null, "  ")}`)
  error.responseStatus = status
  throw error
}
