import { createRequire } from "node:module"

const require = createRequire(import.meta.url)

export const runLighthouse = async (url, lighthouseOptions) => {
  const lighthouse = require("lighthouse")
  const results = await lighthouse(url, undefined, lighthouseOptions)
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

export const reduceToMedianReport = (lighthouseReports) => {
  const {
    computeMedianRun,
  } = require("lighthouse/lighthouse-core/lib/median-run.js")
  return computeMedianRun(lighthouseReports)
}

export const formatReportAsSummaryText = (lighthouseReport) => {
  const scores = {}
  Object.keys(lighthouseReport.categories).forEach((name) => {
    scores[name] = lighthouseReport.categories[name].score
  })
  return JSON.stringify(scores, null, "  ")
}

export const formatReportAsJson = (lighthouseReport) => {
  const json = JSON.stringify(lighthouseReport, null, "  ")
  return json
}

export const formatReportAsHtml = (lighthouseReport) => {
  const ReportGenerator = require("lighthouse/report/generator/report-generator.js")
  const html = ReportGenerator.generateReportHtml(lighthouseReport)
  return html
}
