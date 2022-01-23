import { createRequire } from "node:module"

const require = createRequire(import.meta.url)

const humanizeDuration = require("humanize-duration")

export const formatMs = (metricValue) => {
  return humanizeDuration(metricValue, {
    largest: 2,
    maxDecimalPoints: metricValue < 1 ? 4 : metricValue < 1000 ? 3 : 2,
    // units: ["s"]
  })
}
