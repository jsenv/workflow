import {
  urlToFileSystemPath,
  collectDirectoryMatchReport,
} from "@jsenv/filesystem"

export const applyTrackingConfig = async (
  trackingConfig,
  { projectDirectoryUrl, manifestConfig },
) => {
  const result = {}
  const trackingNames = Object.keys(trackingConfig)
  // ensure keys order is the same as trackingConfig (despite Promise.all below)
  trackingNames.forEach((trackingName) => {
    result[trackingName] = null
  })
  await Promise.all(
    trackingNames.map(async (trackingName) => {
      const tracking = trackingConfig[trackingName]
      const groupTrackingResult = await applyTracking(tracking, {
        projectDirectoryUrl,
        manifestConfig,
      })
      result[trackingName] = groupTrackingResult
    }),
  )
  return result
}

const applyTracking = async (
  tracking,
  { projectDirectoryUrl, manifestConfig },
) => {
  const structuredMetaMap = {
    track: tracking,
    ...(manifestConfig ? { manifest: manifestConfig } : {}),
  }

  let directoryMatchReport

  try {
    directoryMatchReport = await collectDirectoryMatchReport({
      directoryUrl: projectDirectoryUrl,
      structuredMetaMap,
      predicate: (meta) => Boolean(meta.track) || Boolean(meta.manifest),
    })
  } catch (e) {
    const directoryPath = urlToFileSystemPath(projectDirectoryUrl)
    if (e.code === "ENOENT" && e.path === directoryPath) {
      console.warn(`${directoryPath} does not exists`)
      return []
    }
    throw e
  }

  const { matchingArray, ignoredArray } = directoryMatchReport

  const trackedMetaMap = {}
  const ignoredMetaMap = {}
  const manifestMetaMap = {}
  ignoredArray.forEach(({ relativeUrl }) => {
    ignoredMetaMap[relativeUrl] = null
  })
  matchingArray.forEach(({ relativeUrl, meta }) => {
    if (meta.manifest) {
      manifestMetaMap[relativeUrl] = meta.manifest
    } else {
      trackedMetaMap[relativeUrl] = meta.track
    }
  })

  return {
    trackedMetaMap,
    ignoredMetaMap,
    manifestMetaMap,
  }
}
