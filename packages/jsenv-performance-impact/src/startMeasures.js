import { resourceUsage, memoryUsage, emitWarning } from "node:process"
import v8 from "node:v8"
import { runInNewContext } from "node:vm"

export const startMeasures = ({
  duration = true, // will be in milliseconds
  memoryHeapUsage = false,
  filesystemUsage = false,
  gc = false,
} = {}) => {
  if (gc && !global.gc) {
    v8.setFlagsFromString("--expose_gc")
    global.gc = runInNewContext("gc")
    emitWarning(`node must be started with --expose-gc`, {
      CODE: "EXPOSE_GC_IS_MISSING",
      detail: "global.gc forced with v8.setFlagsFromString",
    })
  }

  const measures = []

  if (duration) {
    const beforeMs = Date.now()
    measures.push(() => {
      const afterMs = Date.now()
      const duration = afterMs - beforeMs
      return {
        duration,
      }
    })
  }

  if (filesystemUsage) {
    const beforeRessourceUsage = resourceUsage()
    measures.push(() => {
      const afterRessourceUsage = resourceUsage()
      const fileSystemReadOperationCount =
        afterRessourceUsage.fsRead - beforeRessourceUsage.fsRead
      const fileSystemWriteOperationCount =
        afterRessourceUsage.fsWrite - beforeRessourceUsage.fsWrite
      return {
        fileSystemReadOperationCount,
        fileSystemWriteOperationCount,
      }
    })
  }

  if (memoryHeapUsage) {
    if (gc) {
      global.gc()
    }
    const beforeHeapUsed = memoryUsage().heapUsed
    measures.push(() => {
      if (gc) {
        global.gc()
      }
      const afterHeapUsed = memoryUsage().heapUsed
      const heapUsed = afterHeapUsed - beforeHeapUsed
      return {
        heapUsed,
      }
    })
  }

  const stop = () => {
    let metrics = {}
    measures.forEach((measure) => {
      metrics = {
        ...metrics,
        ...measure(),
      }
    })
    return metrics
  }

  return { stop }
}
