import { assertAndNormalizeDirectoryUrl } from "@jsenv/filesystem"
import { createLogger } from "@jsenv/log"
import { importOneExportFromFile } from "@jsenv/dynamic-import-worker"

import { measureMultipleTimes } from "./internal/measureMultipleTimes.js"
import { assertMetrics } from "./internal/assertions.js"
import { computeMetricsMedian } from "./internal/computeMetricsMedian.js"
import { formatMetricsLog } from "./internal/formatMetricsLog.js"

export const importMetricFromFiles = async ({
  logLevel,
  directoryUrl,
  metricsDescriptions,
}) => {
  const logger = createLogger({ logLevel })

  directoryUrl = assertAndNormalizeDirectoryUrl(directoryUrl)

  const allMetrics = {}
  await Object.keys(metricsDescriptions).reduce(
    async (previous, metricName) => {
      await previous

      const metricsDescription = metricsDescriptions[metricName]
      const {
        file,
        iterations,
        msToWaitBetweenEachIteration = 100,
      } = metricsDescription
      const url = new URL(file, directoryUrl).href

      const measure = async () => {
        const metrics = await importOneExportFromFile(url)
        assertMetrics(metrics, `in ${file}`)
        return metrics
      }

      const metricsWithIterations = await measureMultipleTimes(
        measure,
        iterations,
        {
          msToWaitBetweenEachIteration,
        },
      )
      const metrics = computeMetricsMedian(metricsWithIterations)

      logger.info(formatMetricsLog(metrics))

      allMetrics[metricName] = metrics
    },
    Promise.resolve(),
  )

  return allMetrics
}
