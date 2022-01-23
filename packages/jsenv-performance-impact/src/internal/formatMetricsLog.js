import { formatMetricValue } from "./formatMetricValue.js"

export const formatMetricsLog = (metrics) => {
  const metricsReadable = {}
  Object.keys(metrics).forEach((metricName) => {
    metricsReadable[metricName] = formatMetricValue(metrics[metricName])
  })
  return JSON.stringify(metricsReadable, null, "  ")
}
