// https://github.com/GoogleChrome/lighthouse/blob/5a14deb5c4e0ec4e8e58f50ff72b53851b021bcf/docs/readme.md#using-programmatically

import { assertAndNormalizeFileUrl, writeFileSync } from "@jsenv/filesystem"
import { createLogger } from "@jsenv/log"
import { Abort, raceProcessTeardownEvents } from "@jsenv/abort"

import {
  runLighthouse,
  reduceToMedianReport,
  formatReportAsSummaryText,
  formatReportAsJson,
  formatReportAsHtml,
} from "./generate/lighthouse_api.js"

export const generateLighthouseReport = async (
  url,
  {
    signal = new AbortController().signal,
    handleSIGINT = true,
    logLevel,
    config = null,

    chromiumPort,
    // I'm pretty sure these options are given to lighthouse
    // so that it knows how chrome is currently configured
    // lighthouse won't actually enable the emulated screen width
    // this should be done when starting chrome (with chrome-launcher)
    // in that case I think pupeteer might be better with something like
    // https://github.com/GoogleChrome/lighthouse/issues/14134#issuecomment-1158091067
    // see https://github.com/GoogleChrome/lighthouse/blob/78b93aacacb12ae10f14049c5a16bc48a431f5a6/core/config/constants.js#L70
    // and https://github.com/GoogleChrome/lighthouse/blob/78b93aacacb12ae10f14049c5a16bc48a431f5a6/core/config/desktop-config.js#L10
    emulatedScreenWidth,
    emulatedScreenHeight,
    emulatedDeviceScaleFactor,
    emulatedMobile = true,
    emulatedUserAgent,
    throttling,
    lighthouseSettings = {},

    runCount = 1,
    delayBetweenEachRun = 1_000,

    log = false,
    jsonFileUrl,
    jsonFileLog = true,
    htmlFileUrl,
    htmlFileLog = true,
  } = {},
) => {
  if (chromiumPort === undefined) {
    throw new Error(`"chromiumPort" is required, got ${chromiumPort}`)
  }

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
    if (generateReportOperation.signal.aborted) {
      return { aborted: true }
    }
    const lighthouseOptions = {
      extends: "lighthouse:default",
      port: chromiumPort,
      settings: {
        formatFactor: emulatedMobile ? "mobile" : "desktop",
        throttling,
        screenEmulation: {
          mobile: emulatedMobile,
          width: emulatedScreenWidth,
          height: emulatedScreenHeight,
          deviceScaleFactor: emulatedDeviceScaleFactor,
          disabled: false,
        },
        emulatedUserAgent,
        ...lighthouseSettings,
      },
    }
    const reports = []
    try {
      await Array(runCount)
        .fill()
        .reduce(async (previous, _, index) => {
          generateReportOperation.throwIfAborted()
          await previous
          if (index > 0 && delayBetweenEachRun) {
            await new Promise((resolve) =>
              setTimeout(resolve, delayBetweenEachRun),
            )
          }
          generateReportOperation.throwIfAborted()
          const report = await runLighthouse(url, { lighthouseOptions, config })
          reports.push(report)
        }, Promise.resolve())
    } catch (e) {
      if (Abort.isAbortError(e)) {
        return { aborted: true }
      }
      throw e
    }

    const lighthouseReport = reduceToMedianReport(reports)
    if (log) {
      logger.info(formatReportAsSummaryText(lighthouseReport))
    }
    if (jsonFileUrl) {
      assertAndNormalizeFileUrl(jsonFileUrl)
      const json = formatReportAsJson(lighthouseReport)
      writeFileSync(jsonFileUrl, json)
      if (jsonFileLog) {
        logger.info(`-> ${jsonFileUrl}`)
      }
    }
    if (htmlFileUrl) {
      assertAndNormalizeFileUrl(htmlFileUrl)
      const html = formatReportAsHtml(lighthouseReport)
      writeFileSync(htmlFileUrl, html)
      if (htmlFileLog) {
        logger.info(`-> ${htmlFileUrl}`)
      }
    }
    return lighthouseReport
  }

  try {
    return await jsenvGenerateLighthouseReport()
  } finally {
    await generateReportOperation.end()
  }
}
