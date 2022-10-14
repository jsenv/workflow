import { startServer } from "@jsenv/server"
import { readFile } from "@jsenv/filesystem"
import { assert } from "@jsenv/assert"
import { chromium } from "playwright"

import { generateLighthouseReport } from "@jsenv/lighthouse-impact"

const htmlFileUrl = new URL("./index.html", import.meta.url)

// chrome-launcher does not work on windows
if (process.platform !== "win32") {
  const server = await startServer({
    logLevel: "warn",
    requestToResponse: async () => {
      const htmlFileContent = await readFile(htmlFileUrl, { as: "string" })
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

  const browser = await chromium.launch({
    args: [
      "--headless",
      "--disable-gpu",
      "--no-sandbox",
      "--ignore-certificate-errors",
      "--incognito",
      "--disk-cache-size=1",
      "--remote-debugging-port=9222",
    ],
  })
  const context = await browser.newContext({
    // userAgent: "",
    ignoreHTTPSErrors: true,
    viewport: {
      width: 640,
      height: 380,
    },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 1,
  })

  try {
    const actual = await generateLighthouseReport(server.origin, {
      chromiumPort: "9222",
      // runCount: 2,
      // headless: false,
      // emulatedMobile: true,
      // htmlFileUrl: new URL("./report.html", import.meta.url),
      // jsonFileUrl: new URL("./report.json", import.meta.url),
    })
    const expected = actual
    assert({ actual, expected })
  } finally {
    await context.close()
    await browser.close()
  }
}
