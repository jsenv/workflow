import { executeTestPlan, nodeWorkerThread } from "@jsenv/core"

await executeTestPlan({
  rootDirectoryUrl: new URL("../", import.meta.url),
  testPlan: {
    "test/**/*.test.mjs": {
      node: {
        runtime: nodeWorkerThread,
      },
    },
  },
  completedExecutionLogAbbreviation: true,
  coverage: process.argv.includes("--coverage"),
  coverageTextLog: false,
})
