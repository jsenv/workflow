import { execute, nodeRuntime } from "@jsenv/core"

import { measureMultipleTimes } from "@jsenv/performance-impact/src/internal/measureMultipleTimes.js"
import { computeMetricsMedian } from "@jsenv/performance-impact/src/internal/computeMetricsMedian.js"

const projectDirectoryUrl = new URL("./", import.meta.url)

const measureFilePerformance = async (params) => {
  const executionResult = await execute({
    runtime: nodeRuntime,
    ...params,
    // measurePerformance: true,
    compileServerCanWriteOnFilesystem: false,
    collectPerformance: true,
  })
  const { measures } = executionResult.performance
  const metrics = {}
  Object.keys(measures).forEach((measureName) => {
    metrics[measureName] = { value: measures[measureName], unit: "ms" }
  })
  return metrics
}

const metrics = await measureMultipleTimes(() => {
  return measureFilePerformance({
    projectDirectoryUrl,
    fileRelativeUrl: "file.mjs",
  })
})

console.log(metrics, computeMetricsMedian(metrics))
