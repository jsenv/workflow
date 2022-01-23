import { startServer } from "@jsenv/server"
import { readFile } from "@jsenv/filesystem"
import { assert } from "@jsenv/assert"

import { generateLighthouseReport } from "@jsenv/lighthouse-impact"

const htmlFileUrl = new URL("./index.html", import.meta.url)

// chrome-launcher does not work on windows
if (process.platform !== "win32") {
  const server = await startServer({
    logLevel: "warn",
    requestToResponse: async () => {
      const htmlFileContent = await readFile(htmlFileUrl)
      return {
        status: 200,
        headers: {
          "content-type": "text/html",
        },
        body: htmlFileContent,
      }
    },
    keepProcessAlive: false,
  })

  const actual = await generateLighthouseReport(server.origin, {
    runCount: 2,
  })
  const expected = actual
  assert({ actual, expected })
}
