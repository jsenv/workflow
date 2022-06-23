// https://github.com/GoogleChrome/lighthouse/blob/5a14deb5c4e0ec4e8e58f50ff72b53851b021bcf/docs/readme.md#using-programmatically

import { createRequire } from "node:module"
import { writeFile, assertAndNormalizeDirectoryUrl } from "@jsenv/filesystem"
import { createLogger } from "@jsenv/log"
import { Abort, raceProcessTeardownEvents } from "@jsenv/abort"

import { formatLighthouseReportForLog } from "./internal/formatLighthouseReportForLog.js"

const require = createRequire(import.meta.url)

export const generateLighthouseReport = async (
  url,
  {
    signal = new AbortController().signal,
    handleSIGINT = true,
    logLevel,

    headless = true,
    gpu = false,
    sandbox = false,
    // https://github.com/GoogleChrome/lighthouse/blob/a58510583acd2f796557175ac949932618af49e7/docs/readme.md#testing-on-a-site-with-an-untrusted-certificate
    ignoreCertificateErrors = false,
    config = null,

    runCount = 1,
    delayBetweenEachRunInSeconds = 1,

    rootDirectoryUrl, // required only when jsonFile or htmlFile is passed
    log = false,
    jsonFile = false,
    jsonFileUrl = "./lighthouse/lighthouse_report.json",
    jsonFileLog = true,
    htmlFile = false,
    htmlFileUrl = "./lighthouse/lighthouse_report.html",
    htmlFileLog = true,
  } = {},
) => {
  const ReportGenerator = require("lighthouse/report/generator/report-generator.js")
  const {
    computeMedianRun,
  } = require("lighthouse/lighthouse-core/lib/median-run.js")
  const chromeLauncher = require("chrome-launcher")

  const generateReportOperation = Abort.startOperation()
  generateReportOperation.addAbortSignal(signal)
  if (handleSIGINT) {
    generateReportOperation.addAbortSource((abort) => {
      return raceProcessTeardownEvents(
        {
          SIGINT: true,
        },
        abort,
      )
    })
  }

  const jsenvGenerateLighthouseReport = async () => {
    const logger = createLogger({ logLevel })
    const chromeFlags = [
      ...(headless ? ["--headless"] : []),
      ...(gpu ? [] : ["--disable-gpu"]),
      ...(sandbox ? [] : ["--no-sandbox"]),
      ...(ignoreCertificateErrors ? ["--ignore-certificate-errors"] : []),
      // "--purge_hint_cache_store",
      "--incognito",
      "--disk-cache-size=1",
      // "--disk-cache-dir=/dev/null",
    ]
    const chrome = await chromeLauncher.launch({ chromeFlags })
    if (generateReportOperation.signal.aborted) {
      return { aborted: true }
    }

    const lighthouseOptions = {
      chromeFlags,
      port: chrome.port,
    }

    const reports = []
    try {
      await Array(runCount)
        .fill()
        .reduce(async (previous, _, index) => {
          generateReportOperation.throwIfAborted()
          await previous

          if (index > 0 && delayBetweenEachRunInSeconds) {
            await new Promise((resolve) =>
              setTimeout(resolve, delayBetweenEachRunInSeconds * 1000),
            )
          }
          generateReportOperation.throwIfAborted()
          const report = await generateOneLighthouseReport(url, {
            lighthouseOptions,
            config,
          })
          reports.push(report)
        }, Promise.resolve())
    } catch (e) {
      if (Abort.isAbortError(e)) {
        return { aborted: true }
      }
      throw e
    }

    const lighthouseReport = computeMedianRun(reports)

    if (log) {
      logger.info(formatLighthouseReportForLog(lighthouseReport))
    }

    await chrome.kill()

    if (jsonFile || htmlFile) {
      rootDirectoryUrl = assertAndNormalizeDirectoryUrl(rootDirectoryUrl)
    }

    const promises = []
    if (jsonFile) {
      promises.push(
        (async () => {
          jsonFileUrl = new URL(jsonFileUrl, rootDirectoryUrl).href
          const json = JSON.stringify(lighthouseReport, null, "  ")
          await writeFile(jsonFileUrl, json)
          if (jsonFileLog) {
            logger.info(`-> ${jsonFileUrl}`)
          }
        })(),
      )
    }
    if (htmlFile) {
      promises.push(
        (async () => {
          htmlFileUrl = new URL(htmlFileUrl, rootDirectoryUrl).href
          const html = ReportGenerator.generateReportHtml(lighthouseReport)
          await writeFile(htmlFileUrl, html)
          if (htmlFileLog) {
            logger.info(`-> ${htmlFileUrl}`)
          }
        })(),
      )
    }
    await Promise.all(promises)

    return lighthouseReport
  }

  try {
    return await jsenvGenerateLighthouseReport()
  } finally {
    await generateReportOperation.end()
  }
}

const generateOneLighthouseReport = async (
  url,
  { lighthouseOptions, config },
) => {
  const lighthouse = require("lighthouse")
  const results = await lighthouse(url, lighthouseOptions, config)

  // use results.lhr for the JS-consumeable output
  // https://github.com/GoogleChrome/lighthouse/blob/master/types/lhr.d.ts
  // use results.report for the HTML/JSON/CSV output as a string
  // use results.artifacts for the trace/screenshots/other specific case you need (rarer)
  const { lhr } = results

  const { runtimeError } = lhr
  if (runtimeError) {
    const error = new Error(runtimeError.message)
    Object.assign(error, runtimeError)
    throw error
  }

  return lhr
}
